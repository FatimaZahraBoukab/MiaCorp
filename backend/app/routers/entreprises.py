import json
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
from typing import List, Optional
import uuid
from datetime import datetime
from ..couchdb import CouchDB
from ..models import Entreprise, EntrepriseCreate
from .auth import get_current_active_user

router = APIRouter(
    prefix="/entreprises",
    tags=["entreprises"],
    responses={404: {"description": "Not found"}},
)

ENTREPRISES_COLLECTION = "entreprises"
DOCUMENTS_COLLECTION = "documents"

@router.post("/", response_model=Entreprise)
async def create_entreprise(
    # Modifiez cette partie pour accepter des champs individuels au lieu d'un objet EntrepriseCreate
    nom: str = Form(...),
    type: str = Form(...),
    siret: str = Form(...),
    adresse: str = Form(...),
    capital: float = Form(...),
    description: str = Form(...),
    template_id: str = Form(...),
    valeurs_variables: str = Form(...),  # Ceci sera une chaîne JSON
    piece_identite: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent créer des entreprises")
    
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    documents_db = CouchDB(DOCUMENTS_COLLECTION)
    
    # Vérifier que l'utilisateur n'a pas déjà une entreprise
    existing_entreprises = await entreprises_db.query({"client_id": current_user["id"]})
    if existing_entreprises:
        raise HTTPException(
            status_code=400,
            detail="Vous avez déjà une entreprise enregistrée"
        )
    
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
        "nom": nom,
        "type": type,
        "client_id": current_user["id"],
        "date_creation": datetime.now().isoformat(),
        "siret": siret,
        "adresse": adresse,
        "capital": capital,
        "description": description,
        "template_id": template_id,
        "valeurs_variables": valeurs_variables_dict,
        "piece_identite_id": document_id,
        "statut": "en_attente",
        "commentaires": ""
    }
    
    created_entreprise = await entreprises_db.create(new_entreprise)
    return created_entreprise

@router.get("/me", response_model=Entreprise)
async def get_my_entreprise(current_user: dict = Depends(get_current_active_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent accéder à cette information")
    
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprises = await entreprises_db.query({"client_id": current_user["id"]})
    
    if not entreprises:
        raise HTTPException(status_code=404, detail="Aucune entreprise trouvée")
    
    return entreprises[0]

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
