import json
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
from typing import List, Optional
import uuid
from datetime import datetime
from ..couchdb import CouchDB
from ..models import Entreprise, EntrepriseCreate
from .auth import get_current_active_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/entreprises",
    tags=["entreprises"],
    responses={404: {"description": "Not found"}},
)

# Ajoutez ce modèle au début du fichier
class PieceIdentite(BaseModel):
    content: str  # Base64
    date_upload: datetime
    statut: str

class EntrepriseWithIdentity(Entreprise):
    piece_identite: PieceIdentite

ENTREPRISES_COLLECTION = "entreprises"
DOCUMENTS_COLLECTION = "documents"

@router.post("/", response_model=Entreprise)
async def create_entreprise(
    type: str = Form(...),
    template_id: str = Form(...),
    valeurs_variables: str = Form(...),  # Ceci sera une chaîne JSON
    piece_identite: UploadFile = File(...),
    document_index: Optional[int] = Form(0),
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent créer des entreprises")
    
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    documents_db = CouchDB(DOCUMENTS_COLLECTION)
    
    # Suppression de la vérification qui empêche la création de plusieurs entreprises
    # Cette partie a été retirée pour permettre la création de plusieurs entreprises
    
    # Enregistrer la pièce d'identité
    piece_identite_content = await piece_identite.read()
    document_id = str(uuid.uuid4())
    
    document_data = {
        "id": document_id,
        "type": "piece_identite",
        "client_id": current_user["id"],
        "content": piece_identite_content.decode('latin-1'),  # Stockage simple pour l'exemple
        "date_upload": datetime.now().isoformat(),
        "statut": "en_attente"
    }
    
    await documents_db.create(document_data)
    
    # Convertir valeurs_variables de JSON string en dictionnaire
    try:
        valeurs_variables_dict = json.loads(valeurs_variables)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Le format des valeurs variables est invalide")
    
    # Créer l'entreprise
    new_entreprise = {
        "id": str(uuid.uuid4()),
        "type": type,
        "client_id": current_user["id"],
        "date_creation": datetime.now().isoformat(),
        "template_id": template_id,
        "valeurs_variables": valeurs_variables_dict,
        "piece_identite_id": document_id,
        "statut": "en_attente",
        "commentaires": ""
    }
    
    created_entreprise = await entreprises_db.create(new_entreprise)
    return created_entreprise

@router.get("/me", response_model=List[Entreprise])
async def get_my_entreprises(current_user: dict = Depends(get_current_active_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent accéder à cette information")
    
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprises = await entreprises_db.query({"client_id": current_user["id"]})
    
    if not entreprises:
        raise HTTPException(status_code=404, detail="Aucune entreprise trouvée")
    
    return entreprises

@router.put("/{entreprise_id}/validate", response_model=Entreprise)
async def validate_entreprise(
    entreprise_id: str,
    data: dict,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Seuls les experts peuvent valider des entreprises")
    
    db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    entreprise["statut"] = "validé"
    entreprise["commentaires"] = data.get("commentaires", "")
    entreprise["date_validation"] = datetime.now().isoformat()
    entreprise["valideur_id"] = current_user["id"]
    
    await db.update(entreprise_id, entreprise)
    
    # Ici vous pourriez générer le document final et stocker son ID
    
    return entreprise

@router.put("/{entreprise_id}/reject", response_model=Entreprise)
async def reject_entreprise(
    entreprise_id: str,
    data: dict,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Seuls les experts peuvent rejeter des entreprises")
    
    if not data.get("commentaires"):
        raise HTTPException(status_code=400, detail="Un commentaire est requis pour le rejet")
    
    db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    entreprise["statut"] = "rejeté"
    entreprise["commentaires"] = data.get("commentaires")
    entreprise["date_rejet"] = datetime.now().isoformat()
    entreprise["rejeteur_id"] = current_user["id"]
    
    await db.update(entreprise_id, entreprise)
    return entreprise

@router.get("/", response_model=List[Entreprise])
async def get_entreprises(
    statut: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Seuls les experts peuvent accéder à cette liste")
    
    db = CouchDB(ENTREPRISES_COLLECTION)
    
    if statut:
        entreprises = await db.query({"statut": statut})
    else:
        entreprises = await db.read_all()
    
    return entreprises

@router.get("/{entreprise_id}", response_model=EntrepriseWithIdentity)
async def get_entreprise_by_id(
    entreprise_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Modification ici pour permettre aux clients de voir leurs propres entreprises
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    documents_db = CouchDB(DOCUMENTS_COLLECTION)
    
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Vérifier si l'utilisateur est autorisé à voir cette entreprise
    if current_user["role"] not in ["expert", "admin"]:
        # Si c'est un client, vérifier qu'il est bien le propriétaire de l'entreprise
        if current_user["role"] == "client" and entreprise["client_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Récupérer la pièce d'identité associée
    piece_identite = await documents_db.get_by_id(entreprise["piece_identite_id"])
    if not piece_identite:
        raise HTTPException(status_code=404, detail="Pièce d'identité non trouvée")
    
    # Convertir le contenu en base64 pour l'affichage
    import base64
    entreprise["piece_identite"] = {
        "content": base64.b64encode(piece_identite["content"].encode('latin-1')).decode('utf-8'),
        "date_upload": piece_identite["date_upload"],
        "statut": piece_identite["statut"]
    }
    
    return entreprise

@router.delete("/{entreprise_id}", status_code=204)
async def delete_entreprise(
    entreprise_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Supprime une entreprise.
    Seul le client propriétaire de l'entreprise peut la supprimer.
    """
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent supprimer leurs entreprises")
    
    db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Vérifier que l'entreprise appartient bien à l'utilisateur
    if entreprise["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à supprimer cette entreprise")
    
    # Vérifier si l'entreprise est déjà validée
    if entreprise["statut"] == "validé":
        raise HTTPException(
            status_code=400, 
            detail="Impossible de supprimer une entreprise validée. Veuillez contacter le support."
        )
    
    # Supprimer l'entreprise
    success = await db.delete(entreprise_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression de l'entreprise")
    
    return None  # 204 No Content

# Nouvel endpoint pour récupérer uniquement les commentaires de rejet d'une entreprise
@router.get("/{entreprise_id}/rejection-comment", response_model=dict)
async def get_rejection_comment(
    entreprise_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Récupère uniquement le commentaire de rejet d'une entreprise.
    Le client propriétaire de l'entreprise peut accéder à cette information.
    """
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Vérifier si l'utilisateur est autorisé à voir cette entreprise
    if current_user["role"] not in ["expert", "admin"]:
        # Si c'est un client, vérifier qu'il est bien le propriétaire de l'entreprise
        if current_user["role"] == "client" and entreprise["client_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Vérifier si l'entreprise est rejetée
    if entreprise["statut"] != "rejeté":
        raise HTTPException(status_code=400, detail="Cette entreprise n'a pas été rejetée")
    
    return {
        "id": entreprise["id"],
        "nom": entreprise.get("nom", ""),
        "type": entreprise["type"],
        "statut": entreprise["statut"],
        "date_rejet": entreprise.get("date_rejet", None),
        "commentaires": entreprise.get("commentaires", "")
    }
