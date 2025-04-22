from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime

from ..database import MongoDB
from ..models import User, UserCreate, Client, ClientCreate, ExpertJuridique, ExpertJuridiqueCreate
from .auth import get_current_active_user, get_password_hash

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
    
    users_db = MongoDB(USERS_COLLECTION)
    users = await users_db.read_all(skip=skip, limit=limit)
    
    # Remove passwords from response
    for user in users:
        user.pop("mot_de_passe", None)
    
    return users

@router.get("/me", response_model=User)
async def read_user_me(current_user: dict = Depends(get_current_active_user)):
    return current_user

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str, 
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin or the user themselves can access user details
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_db = MongoDB(USERS_COLLECTION)
    user = await users_db.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove password from response
    user.pop("mot_de_passe", None)
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserCreate,
    current_user: dict = Depends(get_current_active_user)
):
    # Only admin or the user themselves can update user details
    if current_user.get("role") != "admin" and current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users_db = MongoDB(USERS_COLLECTION)
    existing_user = await users_db.get_by_id(user_id)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    updated_user = existing_user.copy()
    updated_user["nom"] = user_update.nom
    updated_user["prenom"] = user_update.prenom
    updated_user["email"] = user_update.email
    updated_user["telephone"] = user_update.telephone
    
    # Only update password if provided
    if hasattr(user_update, "mot_de_passe") and user_update.mot_de_passe:
        updated_user["mot_de_passe"] = get_password_hash(user_update.mot_de_passe)
    
    # Only admin can change role
    if current_user.get("role") == "admin" and hasattr(user_update, "role"):
        updated_user["role"] = user_update.role
    
    updated_user = await users_db.update(user_id, updated_user)
    
    # Remove password from response
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
    
    users_db = MongoDB(USERS_COLLECTION)
    success = await users_db.delete(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"status": "success"}

# Client specific endpoints
@router.post("/clients/", response_model=Client)
async def create_client(client: ClientCreate):
    users_db = MongoDB(USERS_COLLECTION)
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
        "siret": client.siret
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
    
    users_db = MongoDB(USERS_COLLECTION)
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
