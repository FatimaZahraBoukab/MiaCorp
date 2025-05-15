from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image

from ..couchdb import CouchDB
from ..models import User, UserCreate, Client, ClientCreate, ExpertJuridique, ExpertJuridiqueCreate
from .auth import get_current_active_user, get_password_hash, verify_password

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

# MongoDB collection
USERS_COLLECTION = "users"

@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin can list all users
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_db = CouchDB(USERS_COLLECTION)
    users = await users_db.read_all(skip=skip, limit=limit)
    
    # Remove passwords from response
    for user in users:
        user.pop("mot_de_passe", None)
    
    return users

@router.get("/me", response_model=User)
async def read_user_me(current_user: dict = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=User)
async def update_user_me(
    user_update: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    user_id = current_user.get("id")
    
    users_db = CouchDB(USERS_COLLECTION)
    existing_user = await users_db.get_by_id(user_id)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mise à jour uniquement des champs fournis
    updated_user = existing_user.copy()
    for key, value in user_update.items():
        if key != "mot_de_passe" and value is not None:
            updated_user[key] = value
    
    # Traitement spécial pour le mot de passe
    if "mot_de_passe" in user_update and user_update["mot_de_passe"]:
        updated_user["mot_de_passe"] = get_password_hash(user_update["mot_de_passe"])
    
    updated_user = await users_db.update(user_id, updated_user)
    
    # Retirer le mot de passe de la réponse
    if updated_user:
        updated_user.pop("mot_de_passe", None)
    
    return updated_user

@router.put("/me/password", status_code=status.HTTP_200_OK)
async def update_password(
    password_update: dict,
    current_user: dict = Depends(get_current_active_user)
):
    user_id = current_user.get("id")
    
    if "current_password" not in password_update or "new_password" not in password_update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les mots de passe actuels et nouveaux sont requis"
        )
    
    users_db = CouchDB(USERS_COLLECTION)
    existing_user = await users_db.get_by_id(user_id)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Vérifier que le mot de passe actuel est correct
    if not verify_password(password_update["current_password"], existing_user.get("mot_de_passe")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect"
        )
    
    # Mettre à jour le mot de passe
    updated_user = existing_user.copy()
    updated_user["mot_de_passe"] = get_password_hash(password_update["new_password"])
    
    success = await users_db.update(user_id, updated_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour du mot de passe"
        )
    
    return {"message": "Mot de passe mis à jour avec succès"}

@router.post("/me/avatar", response_model=User)
async def update_avatar(
    avatar: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    user_id = current_user.get("id")
    
    users_db = CouchDB(USERS_COLLECTION)
    existing_user = await users_db.get_by_id(user_id)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Lire le contenu du fichier
    contents = await avatar.read()
    
    # Vérifier le type de fichier
    if not avatar.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être une image"
        )
    
    try:
        # Redimensionner l'image pour optimiser la taille
        img = Image.open(BytesIO(contents))
        img.thumbnail((200, 200))  # Redimensionner à 200x200 max
        
        # Convertir l'image en JPEG
        output = BytesIO()
        img.convert("RGB").save(output, format="JPEG", quality=85)
        output.seek(0)
        
        # Encoder en base64
        avatar_base64 = base64.b64encode(output.read()).decode("utf-8")
        
        # Mettre à jour l'utilisateur
        updated_user = existing_user.copy()
        updated_user["avatar"] = f"data:image/jpeg;base64,{avatar_base64}"
        
        success = await users_db.update(user_id, updated_user)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de la mise à jour de l'avatar"
            )
        
        # Retirer le mot de passe de la réponse
        updated_user.pop("mot_de_passe", None)
        
        return updated_user
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement de l'image: {str(e)}"
        )

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str, 
    current_user: dict = Depends(get_current_active_user)
):
    # Admin, experts, or the user themselves can access user details
    if current_user.get("role") != "admin" and current_user.get("role") != "expert" and current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_db = CouchDB(USERS_COLLECTION)
    user = await users_db.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove password from response
    user.pop("mot_de_passe", None)
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: dict,
    current_user: dict = Depends(get_current_active_user)
):
    # Vérification des permissions
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users_db = CouchDB(USERS_COLLECTION)
    existing_user = await users_db.get_by_id(user_id)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mise à jour uniquement des champs fournis
    updated_user = existing_user.copy()
    for key, value in user_update.items():
        if key != "mot_de_passe" and value is not None:
            updated_user[key] = value
    
    # Traitement spécial pour le mot de passe
    if "mot_de_passe" in user_update and user_update["mot_de_passe"]:
        updated_user["mot_de_passe"] = get_password_hash(user_update["mot_de_passe"])
    
    # Seul l'admin peut changer le rôle
    if current_user.get("role") != "admin" and "role" in user_update:
        user_update.pop("role")  # Ignore le changement de rôle
    
    updated_user = await users_db.update(user_id, updated_user)
    
    # Retirer le mot de passe de la réponse
    if updated_user:
        updated_user.pop("mot_de_passe", None)
    
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin can delete users
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    print(f"Tentative de suppression de l'utilisateur avec ID: {user_id}")
    
    users_db = CouchDB(USERS_COLLECTION)
    success = await users_db.delete(user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"status": "success"}

# Client specific endpoints
@router.post("/clients/", response_model=Client)
async def create_client(client: ClientCreate):
    users_db = CouchDB(USERS_COLLECTION)
    existing_users = await users_db.query({"email": client.email})
    if existing_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(client.mot_de_passe)
    
    new_client = {
        "id": str(uuid.uuid4()),
        "nom": client.nom,
        "prenom": client.prenom,
        "email": client.email,
        "telephone": client.telephone,
        "mot_de_passe": hashed_password,
        "date_inscription": datetime.now().isoformat(),
        "est_actif": True,
        "role": "client",
        "adresse": client.adresse,
        "entreprise": client.entreprise,
        "siret": client.siret,
        "acceptEmails": client.acceptEmails if hasattr(client, "acceptEmails") else False
    }
    
    created_client = await users_db.create(new_client)
    
    # Remove password from response
    created_client.pop("mot_de_passe")
    return created_client

# Expert juridique specific endpoints
@router.post("/experts/", response_model=ExpertJuridique)
async def create_expert(
    expert: ExpertJuridiqueCreate,
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin can create experts
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_db = CouchDB(USERS_COLLECTION)
    existing_users = await users_db.query({"email": expert.email})
    if existing_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(expert.mot_de_passe)
    
    new_expert = {
        "id": str(uuid.uuid4()),
        "nom": expert.nom,
        "prenom": expert.prenom,
        "email": expert.email,
        "telephone": expert.telephone,
        "mot_de_passe": hashed_password,
        "date_inscription": datetime.now().isoformat(),
        "est_actif": True,
        "role": "expert",
        "numero_professionnel": expert.numero_professionnel
    }
    
    created_expert = await users_db.create(new_expert)
    
    # Remove password from response
    created_expert.pop("mot_de_passe")
    return created_expert
