from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import uuid
import re
import json
from ..models import DocumentTemplateCreate, DocumentTemplate, TemplateVariable, TypeEntreprise
from .auth import get_current_active_user
from ..utils.google_docs_utils import extract_variables_from_doc, get_google_doc_content
from ..couchdb import CouchDB
from typing import List

router = APIRouter(prefix="/templates", tags=["templates"])
TEMPLATES_COLLECTION = "templates"

class TemplateLoopDetector:
    """Détecteur automatique de boucles dans les templates."""
    
    def __init__(self):
        self.shareholder_keywords = [
            'nom_associe', 'date_naissance_associe', 'lieu_naissance_associe',
            'adresse_associe', 'nationalite_associe', 'apport_numeraire_associe',
            'nombre_parts_associe', 'nombre_actions_associe'
        ]
        
        self.loop_markers = {
            'ACTIONNAIRES': ['{{#LOOP_ACTIONNAIRES}}', '{{/LOOP_ACTIONNAIRES}}'],
            'GERANTS': ['{{#LOOP_GERANTS}}', '{{/LOOP_GERANTS}}'],
            'PRESIDENTS': ['{{#LOOP_PRESIDENTS}}', '{{/LOOP_PRESIDENTS}}']
        }
    
    def detect_shareholder_sections(self, content: str) -> bool:
        """Détecte si le document contient des sections d'actionnaires répétitives."""
        shareholder_patterns = [
            r'{{nom_associe}}',
            r'ENTRE LES SOUSSIGNES',
            r'{{date_naissance_associe}}',
            r'{{apport_numeraire_associe}}',
            r'{{nombre_parts_associe}}',
            r'{{nombre_actions_associe}}'  # AJOUT: Nouveau pattern
        ]
        
        pattern_count = sum(1 for pattern in shareholder_patterns if re.search(pattern, content, re.IGNORECASE))
        return pattern_count >= 3
    
    def has_existing_loops(self, content: str) -> bool:
        """Vérifie si le document a déjà des marqueurs de boucle."""
        return bool(re.search(r'{{#LOOP_.*?}}', content))
    
    def get_loop_types(self, content: str) -> list:
        """Retourne les types de boucles trouvés dans le document."""
        return re.findall(r'{{#LOOP_(.*?)}}', content)
    
    def suggest_loop_additions(self, content: str, entreprise_type: str) -> dict:
        """Suggère l'ajout de boucles pour le document."""
        suggestions = {
            'needs_loops': False,
            'suggested_loops': [],
            'detected_variables': [],
            'confidence': 'low'
        }
        
        # CORRECTION: Supporter tous les types d'entreprise
        if entreprise_type not in ['SARL', 'SAS', 'SASU', 'EURL']:
            return suggestions
        
        # Détecter les variables d'actionnaires
        for keyword in self.shareholder_keywords:
            if f"{{{{{keyword}}}}}" in content:
                suggestions['detected_variables'].append(keyword)
        
        # Analyser le besoin de boucles
        # Pour SASU et EURL (unipersonnelles), pas besoin de boucles multiples
        if entreprise_type in ['SASU', 'EURL']:
            suggestions['needs_loops'] = False
        elif len(suggestions['detected_variables']) >= 3:
            suggestions['needs_loops'] = True
            suggestions['suggested_loops'].append('ACTIONNAIRES')
            suggestions['confidence'] = 'high' if len(suggestions['detected_variables']) >= 5 else 'medium'
        
        return suggestions

def extract_doc_id_from_url(url: str) -> str:
    """Extrait l'ID d'un document Google Docs à partir de son URL."""
    if '/d/' in url:
        parts = url.split('/d/')[1].split('/')
        return parts[0]
    return url

def detect_variable_type(variable_name: str) -> str:
    """Détecte le type d'une variable basée sur son nom."""
    variable_name = variable_name.lower().strip()
    
    if variable_name.startswith("date_"):
        return "date"
    if variable_name.startswith("datetime_"):
        return "datetime"
    if any(variable_name.startswith(prefix) for prefix in ["num_", "montant_", "somme_", "nombre_", "quantite_", "capital_", "apport_"]):
        return "number"
    if any(variable_name.startswith(prefix) for prefix in ["bool_", "est_", "a_", "accepte_"]):
        return "boolean"
    if variable_name.startswith("email_") or "email" in variable_name:
        return "email"
    if any(variable_name.startswith(prefix) for prefix in ["tel_", "telephone_", "mobile_"]):
        return "tel"
    if variable_name.startswith("adresse_"):
        return "address"
    if variable_name.startswith("liste_") or variable_name.endswith("_options"):
        return "select"
    
    return "text"

def enrich_variable_template(variable: dict) -> dict:
    """Enrichit un template de variable avec des valeurs par défaut selon son type."""
    var_type = variable.get("type", "text")
    
    default_values = {
        "date": "",
        "datetime": "",
        "number": "0",
        "boolean": "false",
        "email": "",
        "tel": "",
        "address": "",
        "select": "[]",
        "text": ""
    }
    
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
    
    if "description" not in variable or not variable["description"]:
        variable["description"] = descriptions.get(var_type, "")
    
    if "valeur_defaut" not in variable or variable["valeur_defaut"] is None:
        variable["valeur_defaut"] = default_values.get(var_type, "")
    
    return variable

def filter_loop_and_condition_variables(variables: list) -> list:
    """CORRECTION MAJEURE: Filtre strictement les variables qui sont des marqueurs de boucles et conditions."""
    filtered_variables = []
    
    for var_name in variables:
        var_name = var_name.strip()
        
        # CORRECTION: Exclure STRICTEMENT tous les marqueurs de boucles et conditions
        # Patterns à exclure complètement de la base de données
        excluded_patterns = [
            '#LOOP_', '/LOOP_',           # Marqueurs de boucles
            '#IF_', '/IF_',               # Marqueurs de conditions  
            '{{#', '{{/',                 # Marqueurs avec accolades
            '#LOOP_ACTIONNAIRES', '/LOOP_ACTIONNAIRES',
            '#LOOP_GERANTS', '/LOOP_GERANTS', 
            '#LOOP_PRESIDENTS', '/LOOP_PRESIDENTS',
            '#IF_GERANT', '/IF_GERANT',
            '#IF_PRESIDENT', '/IF_PRESIDENT'
        ]
        
        # Vérifier si la variable contient un des patterns exclus
        should_exclude = False
        for pattern in excluded_patterns:
            if pattern in var_name:
                should_exclude = True
                break
        
        # Ne pas ajouter les variables qui sont des marqueurs
        if not should_exclude:
            filtered_variables.append(var_name)
        else:
            print(f"EXCLU de la base de données: {var_name}")
    
    return filtered_variables

@router.post("/", response_model=DocumentTemplate)
async def create_template(template: DocumentTemplateCreate, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    documents_with_variables = []
    all_variables = set()
    loop_detector = TemplateLoopDetector()
    
    for doc in template.documents:
        doc_id = extract_doc_id_from_url(doc.google_doc_id)
        
        try:
            # Récupérer le contenu du document
            doc_content = get_google_doc_content(doc_id)
            
            # Analyser le document pour les boucles
            loop_analysis = loop_detector.suggest_loop_additions(doc_content, template.type_entreprise)
            has_existing_loops = loop_detector.has_existing_loops(doc_content)
            existing_loop_types = loop_detector.get_loop_types(doc_content)
            
            print(f"Analyse des boucles pour {doc.titre}:")
            print(f"  - A des boucles existantes: {has_existing_loops}")
            print(f"  - Types de boucles existantes: {existing_loop_types}")
            print(f"  - Suggestions: {loop_analysis}")
            
            # Extraire les variables
            raw_variable_names = extract_variables_from_doc(doc_id)
            
            # CORRECTION: Filtrer les marqueurs de boucles et conditions
            variable_names = filter_loop_and_condition_variables(raw_variable_names)
            
            doc_variables = []
            
            # Ajouter des variables spéciales pour les actionnaires si c'est SARL, SAS, SASU ou EURL
            if template.type_entreprise in ['SARL', 'SAS', 'SASU', 'EURL']:
                special_variables = [
                    'nombre_actionnaires',
                    'liste_actionnaires',
                    'total_apports_numeraire',
                    'nombre_total_parts',
                    'nombre_total_actions'
                ]
                variable_names.extend(special_variables)
            
            for var_name in variable_names:
                var_name = var_name.strip()
                all_variables.add(var_name)
                
                var_type = detect_variable_type(var_name)
                variable = {
                    "id": str(uuid.uuid4()),
                    "nom": var_name,
                    "type": var_type,
                    "obligatoire": True
                }
                
                # Variables spéciales pour les actionnaires (non obligatoires car générées automatiquement)
                if var_name in ['nombre_actionnaires', 'liste_actionnaires', 'total_apports_numeraire', 'nombre_total_parts', 'nombre_total_actions']:
                    variable["obligatoire"] = False
                    variable["description"] = "Généré automatiquement à partir des données des actionnaires"
                
                variable = enrich_variable_template(variable)
                doc_variables.append(variable)
            
            doc_dict = doc.dict()
            doc_dict["variables"] = doc_variables
            doc_dict["has_shareholder_loop"] = has_existing_loops and 'ACTIONNAIRES' in existing_loop_types
            doc_dict["loop_analysis"] = loop_analysis
            doc_dict["existing_loop_types"] = existing_loop_types
            documents_with_variables.append(doc_dict)
            
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Impossible d'extraire les variables du document {doc.titre}: {str(e)}"
            )

    template_data = {
        "id": str(uuid.uuid4()),
        "titre": template.titre,
        "description": template.description,
        "type_entreprise": template.type_entreprise,
        "documents": documents_with_variables,
        "variables": [],
        "est_actif": True,
        "statut": "en_attente",
        "date_creation": datetime.now().isoformat(),
        "supports_dynamic_shareholders": template.type_entreprise in ['SARL', 'SAS', 'SASU', 'EURL']
    }

    db = CouchDB(TEMPLATES_COLLECTION)
    await db.create(template_data)
    return template_data

# ... (reste des endpoints inchangés)
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
        if key != "refresh_variables" and value is not None:
            updated_template[key] = value
    
    # Si des documents sont fournis ou si on demande un rafraîchissement des variables
    if "documents" in template_update or template_update.get("refresh_variables", False):
        loop_detector = TemplateLoopDetector()
        documents = updated_template.get("documents", [])
        all_variables = set()
        
        for doc in documents:
            doc_id = extract_doc_id_from_url(doc["google_doc_id"])
            try:
                # Analyser le document pour les boucles
                doc_content = get_google_doc_content(doc_id)
                loop_analysis = loop_detector.suggest_loop_additions(doc_content, updated_template.get("type_entreprise"))
                has_existing_loops = loop_detector.has_existing_loops(doc_content)
                existing_loop_types = loop_detector.get_loop_types(doc_content)
                
                # Mettre à jour les informations de boucle du document
                doc["has_shareholder_loop"] = has_existing_loops and 'ACTIONNAIRES' in existing_loop_types
                doc["loop_analysis"] = loop_analysis
                doc["existing_loop_types"] = existing_loop_types
                
                # CORRECTION: Filtrer les marqueurs de boucles
                raw_variable_names = extract_variables_from_doc(doc_id)
                variable_names = filter_loop_and_condition_variables(raw_variable_names)
                
                for var in variable_names:
                    all_variables.add(var.strip())
            except Exception as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Erreur lors de l'extraction des variables du document {doc.get('titre', '')}: {str(e)}"
                )
        
        # Ajouter des variables spéciales pour les actionnaires si c'est SARL, SAS, SASU ou EURL
        if updated_template.get("type_entreprise") in ['SARL', 'SAS', 'SASU', 'EURL']:
            special_variables = [
                'nombre_actionnaires',
                'liste_actionnaires',
                'total_apports_numeraire',
                'nombre_total_parts',
                'nombre_total_actions'
            ]
            all_variables.update(special_variables)
        
        # Créer de nouvelles variables
        variables = []
        for var_name in all_variables:
            var_type = detect_variable_type(var_name)
            
            variable = {
                "id": str(uuid.uuid4()),
                "nom": var_name,
                "type": var_type,
                "obligatoire": True
            }
            
            # Variables spéciales pour les actionnaires (non obligatoires)
            if var_name in ['nombre_actionnaires', 'liste_actionnaires', 'total_apports_numeraire', 'nombre_total_parts', 'nombre_total_actions']:
                variable["obligatoire"] = False
                variable["description"] = "Généré automatiquement à partir des données des actionnaires"
            
            variable = enrich_variable_template(variable)
            variables.append(variable)
            
        updated_template["variables"] = variables
        updated_template["supports_dynamic_shareholders"] = updated_template.get("type_entreprise") in ['SARL', 'SAS', 'SASU', 'EURL']
    
    result = await db.update(template_id, updated_template)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return result

@router.get("/{template_id}/content")
async def get_template_content(template_id: str, document_index: int = 0, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "admin" and current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    template = await db.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if not template.get("documents") or len(template["documents"]) <= document_index:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = template["documents"][document_index]
    
    try:
        content = get_google_doc_content(document["google_doc_id"])
        
        # Analyser le contenu pour les boucles
        loop_detector = TemplateLoopDetector()
        has_existing_loops = loop_detector.has_existing_loops(content)
        existing_loop_types = loop_detector.get_loop_types(content)
        loop_suggestions = loop_detector.suggest_loop_additions(content, template.get("type_entreprise"))
        
        return {
            "content": content,
            "variables": template.get("variables", []),
            "document": document,
            "supports_dynamic_shareholders": template.get("supports_dynamic_shareholders", False),
            "has_shareholder_loop": document.get("has_shareholder_loop", False),
            "loop_analysis": {
                "has_existing_loops": has_existing_loops,
                "existing_loop_types": existing_loop_types,
                "suggestions": loop_suggestions
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Could not fetch document content: {str(e)}"
        )

@router.get("/{template_id}/documents")
async def get_template_documents(template_id: str, current_user=Depends(get_current_active_user)):
    if current_user["role"] not in ["admin", "expert", "client"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    template = await db.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template.get("documents", [])
    
@router.get("/expert", response_model=List[DocumentTemplate])
async def get_expert_templates(skip: int = 0, limit: int = 100, current_user=Depends(get_current_active_user)):
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
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
    commentaires = data.get("commentaires", "").strip()
    if not commentaires:
        raise HTTPException(status_code=400, detail="Comments are required for rejection")
    
    # Mettre à jour le statut et les commentaires
    existing_template["statut"] = "rejeté"
    existing_template["commentaires"] = commentaires
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
    
    return templates[0].get("variables", [])

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

@router.get("/by-type/{type_entreprise}", response_model=DocumentTemplate)
async def get_template_by_type(type_entreprise: TypeEntreprise, current_user=Depends(get_current_active_user)):
    db = CouchDB(TEMPLATES_COLLECTION)
    templates = await db.query({
        "type_entreprise": type_entreprise.value,
        "statut": "validé"
    })
    
    if not templates:
        raise HTTPException(status_code=404, detail="Aucun template trouvé pour ce type d'entreprise")
    
    return templates[0]

@router.post("/{template_id}/analyze-loops")
async def analyze_template_loops(template_id: str, current_user=Depends(get_current_active_user)):
    """Analyse les boucles dans un template et fournit des suggestions."""
    if current_user["role"] not in ["admin", "expert"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = CouchDB(TEMPLATES_COLLECTION)
    template = await db.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    loop_detector = TemplateLoopDetector()
    analysis_results = []
    
    for i, document in enumerate(template.get("documents", [])):
        try:
            doc_content = get_google_doc_content(document["google_doc_id"])
            
            analysis = {
                "document_index": i,
                "document_title": document.get("titre", f"Document {i+1}"),
                "has_existing_loops": loop_detector.has_existing_loops(doc_content),
                "existing_loop_types": loop_detector.get_loop_types(doc_content),
                "suggestions": loop_detector.suggest_loop_additions(doc_content, template.get("type_entreprise")),
                "content_preview": doc_content[:200] + "..." if len(doc_content) > 200 else doc_content
            }
            
            analysis_results.append(analysis)
            
        except Exception as e:
            analysis_results.append({
                "document_index": i,
                "document_title": document.get("titre", f"Document {i+1}"),
                "error": str(e)
            })
    
    return {
        "template_id": template_id,
        "template_title": template.get("titre"),
        "type_entreprise": template.get("type_entreprise"),
        "supports_dynamic_shareholders": template.get("supports_dynamic_shareholders", False),
        "documents_analysis": analysis_results
    }
