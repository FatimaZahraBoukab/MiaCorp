# routes/templates.py
from fastapi import APIRouter, Depends, HTTPException, logger
from datetime import datetime
import uuid
from ..models import DocumentTemplateCreate, DocumentTemplate, TemplateVariable, TypeEntreprise
from .auth import get_current_active_user
from ..utils.google_docs_utils import extract_variables_from_doc, get_google_doc_content
from ..couchdb import CouchDB
from typing import List
from urllib.parse import urlparse
import re

router = APIRouter(prefix="/templates", tags=["templates"])
TEMPLATES_COLLECTION = "templates"


def extract_doc_id_from_url(url: str) -> str:
    """Extrait l'ID d'un document Google Docs à partir de son URL."""
    # Gestion des URLs courts (https://docs.google.com/document/d/DOC_ID/edit?usp=sharing)
    if '/d/' in url:
        parts = url.split('/d/')[1].split('/')
        return parts[0]
    # Gestion des IDs bruts
    return url

# Fonction pour détecter automatiquement le type d'une variable basée sur son nom
def detect_variable_type(variable_name: str) -> str:
    """
    Détecte le type d'une variable basée sur son nom ou préfixe.
    
    Types détectés:
    - date_* -> date
    - datetime_* -> datetime
    - num_*, montant_*, somme_* -> number
    - bool_*, est_* -> boolean
    - email_* -> email
    - tel_*, telephone_*, mobile_* -> tel
    - adresse_* -> address
    - liste_* -> select
    - *_options -> select
    - Par défaut -> text
    """
    variable_name = variable_name.lower().strip()
    
    # Détecter les dates
    if variable_name.startswith("date_"):
        return "date"
    
    # Détecter les datetime
    if variable_name.startswith("datetime_"):
        return "datetime"
    
    # Détecter les nombres
    if any(variable_name.startswith(prefix) for prefix in ["num_", "montant_", "somme_", "nombre_", "quantite_"]):
        return "number"
    
    # Détecter les booléens
    if any(variable_name.startswith(prefix) for prefix in ["bool_", "est_", "a_", "accepte_"]):
        return "boolean"
    
    # Détecter les emails
    if variable_name.startswith("email_") or "email" in variable_name:
        return "email"
    
    # Détecter les téléphones
    if any(variable_name.startswith(prefix) for prefix in ["tel_", "telephone_", "mobile_"]):
        return "tel"
    
    # Détecter les adresses
    if variable_name.startswith("adresse_"):
        return "address"
    
    # Détecter les listes à choix multiple
    if variable_name.startswith("liste_") or variable_name.endswith("_options"):
        return "select"
    
    # Type par défaut
    return "text"

# Fonction pour enrichir les templates de variables avec des valeurs par défaut selon le type
def enrich_variable_template(variable: dict) -> dict:
    """
    Enrichit un template de variable avec des valeurs par défaut selon son type.
    """
    var_type = variable.get("type", "text")
    
    # Valeurs par défaut selon le type
    default_values = {
        "date": "",
        "datetime": "",
        "number": "0",
        "boolean": "false",
        "email": "",
        "tel": "",
        "address": "",
        "select": "[]",  # Liste vide en JSON
        "text": ""
    }
    
    # Description selon le type
    descriptions = {
        "date": "Format: JJ/MM/AAAA",
        "datetime": "Format: JJ/MM/AAAA HH:MM",
        "number": "Valeur numérique",
        "boolean": "Valeur booléenne (vrai/faux)",
        "email": "Adresse email valide",
        "tel": "Numéro de téléphone",
        "address": "Adresse postale",
        "select": "Liste d'options disponibles",
        "text": "Texte libre"
    }
    
    # Enrichir la variable
    if "description" not in variable or not variable["description"]:
        variable["description"] = descriptions.get(var_type, "")
    
    if "valeur_defaut" not in variable or variable["valeur_defaut"] is None:
        variable["valeur_defaut"] = default_values.get(var_type, "")
    
    return variable

@router.post("/", response_model=DocumentTemplate)
async def create_template(template: DocumentTemplateCreate, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Extraire l'ID du document à partir de l'URL
    doc_id = extract_doc_id_from_url(template.google_doc_id)
    
    try:
        variable_names = extract_variables_from_doc(doc_id)
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Impossible d'extraire les variables du document: {str(e)}"
        )
    
    variables = []
    for var in variable_names:
        var_name = var.strip()
        var_type = detect_variable_type(var_name)
        
        variable = {
            "id": str(uuid.uuid4()),
            "nom": var_name,
            "type": var_type,
            "obligatoire": True
        }
        
        # Enrichir avec des valeurs par défaut et des descriptions
        variable = enrich_variable_template(variable)
        variables.append(variable)

    template_data = {
        "id": str(uuid.uuid4()),
        "titre": template.titre,
        "description": template.description,
        "type_entreprise": template.type_entreprise,
        "google_doc_id": template.google_doc_id,
        "google_doc_url": template.google_doc_id,  # Stocker aussi l'URL complète
        "variables": variables,
        "est_actif": True,
        "statut": "en_attente",
        "date_creation": datetime.now().isoformat()
    }

    db = CouchDB(TEMPLATES_COLLECTION)
    await db.create(template_data)
    return template_data


@router.get("/", response_model=List[DocumentTemplate])
async def get_templates(skip: int = 0, limit: int = 100, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    templates = await db.read_all(skip=skip, limit=limit)
    return templates

@router.delete("/{template_id}", status_code=204)
async def delete_template(template_id: str, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    # Correction: passer directement l'ID au lieu d'un dictionnaire
    success = await db.delete(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"status": "success"}

@router.put("/{template_id}", response_model=DocumentTemplate)
async def update_template(
    template_id: str,
    template_update: dict,
    current_user=Depends(get_current_active_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    existing_template = await db.get_by_id(template_id)
    if not existing_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Mettre à jour les champs fournis
    updated_template = existing_template.copy()
    for key, value in template_update.items():
        if key != "refresh_variables" and value is not None:  # Ignorer le champ refresh_variables
            updated_template[key] = value
    
    # Si un nouveau google_doc_id est fourni, extraire les variables
    if "google_doc_id" in template_update and template_update["google_doc_id"] != existing_template.get("google_doc_id") or template_update.get("refresh_variables", False):
        doc_id = extract_doc_id_from_url(updated_template["google_doc_id"])
        try:
            variable_names = extract_variables_from_doc(doc_id)
            variables = []
            for var in variable_names:
                var_name = var.strip()
                var_type = detect_variable_type(var_name)
                
                variable = {
                    "id": str(uuid.uuid4()),
                    "nom": var_name,
                    "type": var_type,
                    "obligatoire": True
                }
                
                # Enrichir avec des valeurs par défaut et des descriptions
                variable = enrich_variable_template(variable)
                variables.append(variable)
                
            updated_template["variables"] = variables
        except Exception as e:
            print(f"Erreur lors de l'extraction des variables: {e}")
    
    result = await db.update(template_id, updated_template)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return result


@router.get("/{template_id}/content")
async def get_template_content(template_id: str, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "admin" and current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    template = await db.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        content = get_google_doc_content(template["google_doc_id"])
        return {
            "content": content,
            "variables": template.get("variables", [])
        }
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Could not fetch document content: {str(e)}"
        )
    
@router.get("/expert", response_model=List[DocumentTemplate])
async def get_expert_templates(skip: int = 0, limit: int = 100, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    # Vous pourriez vouloir filtrer ou trier les templates différemment pour les experts
    templates = await db.read_all(skip=skip, limit=limit)
    return templates

@router.put("/{template_id}/validate", response_model=DocumentTemplate)
async def validate_template(
    template_id: str,
    data: dict,
    current_user=Depends(get_current_active_user)
):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    existing_template = await db.get_by_id(template_id)
    if not existing_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Mettre à jour le statut et les commentaires
    existing_template["statut"] = "validé"
    existing_template["commentaires"] = data.get("commentaires", "")
    existing_template["date_validation"] = datetime.now().isoformat()
    existing_template["valideur_id"] = current_user["id"]
    
    result = await db.update(template_id, existing_template)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update template")
    
    return result

@router.put("/{template_id}/reject", response_model=DocumentTemplate)
async def reject_template(
    template_id: str,
    data: dict,
    current_user=Depends(get_current_active_user)
):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    existing_template = await db.get_by_id(template_id)
    if not existing_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Vérifier que des commentaires sont fournis pour le rejet
    if not data.get("commentaires"):
        raise HTTPException(status_code=400, detail="Comments are required for rejection")
    
    # Mettre à jour le statut et les commentaires
    existing_template["statut"] = "rejeté"
    existing_template["commentaires"] = data.get("commentaires")
    existing_template["date_rejet"] = datetime.now().isoformat()
    existing_template["rejeteur_id"] = current_user["id"]
    
    result = await db.update(template_id, existing_template)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update template")
    
    return result

@router.get("/types", response_model=List[TypeEntreprise])
async def get_entreprise_types():
    return [t.value for t in TypeEntreprise]

@router.get("/{type_entreprise}/variables", response_model=List[TemplateVariable])
async def get_template_variables_by_type(
    type_entreprise: TypeEntreprise,
    current_user=Depends(get_current_active_user)
):
    db = CouchDB(TEMPLATES_COLLECTION)
    templates = await db.query({
        "type_entreprise": type_entreprise.value,
        "statut": "validé"
    })
    
    if not templates:
        raise HTTPException(status_code=404, detail="Aucun template trouvé pour ce type d'entreprise")
    
    # Prendre le premier template valide trouvé
    return templates[0].get("variables", [])


# Ajout d'un nouvel endpoint pour récupérer un template par ID
@router.get("/{template_id}", response_model=DocumentTemplate)
async def get_template_by_id(template_id: str, current_user=Depends(get_current_active_user)):
    """Récupère un template par son ID."""
    if current_user["role"] not in ["admin", "expert", "client"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    template = await db.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

# Ajoutez ce nouvel endpoint dans templates.py

@router.post("/{template_id}/preview")
async def preview_template(
    template_id: str,
    data: dict,
    current_user=Depends(get_current_active_user)
):
    """Génère une prévisualisation du template avec les valeurs des variables remplies."""
    db = CouchDB(TEMPLATES_COLLECTION)
    template = await db.get_by_id(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Récupérer les valeurs des variables fournies par l'utilisateur
    valeurs_variables = data.get("valeurs_variables", {})
    
    try:
        # Récupérer le contenu du document Google Docs
        doc_id = extract_doc_id_from_url(template["google_doc_id"])
        content = get_google_doc_content(doc_id)
        
        # Remplacer les variables par les valeurs fournies
        for var_name, var_value in valeurs_variables.items():
            placeholder = f"{{${var_name}}}"
            content = content.replace(placeholder, str(var_value))
        
        # Vous pourriez éventuellement créer une copie temporaire du document
        # pour permettre la prévisualisation, mais pour l'instant retournons juste l'ID du doc original
        
        return {
            "preview_available": True,
            "google_doc_id": doc_id,
            "template_id": template_id
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération de la prévisualisation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération de la prévisualisation: {str(e)}"
        )