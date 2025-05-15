from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional
from ..couchdb import CouchDB
from .auth import get_current_active_user
import io
import re
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
import logging
from ..utils.google_docs_utils import get_google_doc_content, extract_doc_id_from_url

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pour les documents Word, utilisez python-docx
try:
    from docx import Document
    from docx.shared import Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logger.warning("python-docx not installed. Word export will not be available.")

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    responses={404: {"description": "Not found"}},
)

DOCUMENTS_COLLECTION = "documents"
ENTREPRISES_COLLECTION = "entreprises"
TEMPLATES_COLLECTION = "templates"

@router.get("/export/{entreprise_id}")
async def export_document(
    entreprise_id: str,
    document_index: int = 0,  # Nouvel argument pour spécifier quel document exporter
    format: str = "pdf",
    current_user: dict = Depends(get_current_active_user)
):
    """
    Exporte un document au format PDF ou DOCX avec les variables remplacées par les valeurs du client.
    Le paramètre document_index permet de spécifier quel document du template exporter.
    """
    # Vérifier que l'utilisateur est autorisé (client propriétaire ou expert)
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Log pour déboguer
    logger.info(f"Entreprise trouvée: {entreprise_id}")
    logger.info(f"Template ID associé: {entreprise.get('template_id', 'Non défini')}")
    logger.info(f"Document index demandé: {document_index}")
    
    # Vérifier que l'utilisateur est le propriétaire de l'entreprise ou un expert
    if current_user["role"] != "expert" and current_user["id"] != entreprise["client_id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accéder à ce document")
    
    # Vérifier que l'entreprise est validée
    if entreprise["statut"] != "validé":
        raise HTTPException(status_code=400, detail="L'entreprise doit être validée pour exporter le document")
    
    # Vérifier si template_id existe dans l'entreprise
    if "template_id" not in entreprise or not entreprise["template_id"]:
        # Si template_id n'existe pas, utiliser le type d'entreprise pour trouver un template
        logger.warning(f"Pas de template_id dans l'entreprise {entreprise_id}, recherche par type")
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
        
        if not templates:
            raise HTTPException(
                status_code=404, 
                detail=f"Aucun template trouvé pour le type d'entreprise {entreprise['type']}"
            )
        
        # Utiliser le premier template trouvé
        template = templates[0]
        logger.info(f"Template trouvé par type: {template['id']}")
    else:
        # Récupérer le template associé à l'entreprise
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        template = await templates_db.get_by_id(entreprise["template_id"])
        
        if not template:
            # Essayer de trouver un template par type si le template_id ne fonctionne pas
            logger.warning(f"Template {entreprise['template_id']} non trouvé, recherche par type")
            templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
            
            if not templates:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Template {entreprise['template_id']} non trouvé et aucun template alternatif disponible"
                )
            
            # Utiliser le premier template trouvé
            template = templates[0]
            logger.info(f"Template alternatif trouvé: {template['id']}")
    
    # Vérifier que le document à l'index spécifié existe
    if not template.get("documents") or len(template["documents"]) <= document_index:
        raise HTTPException(
            status_code=404, 
            detail=f"Document à l'index {document_index} non trouvé dans le template"
        )
    
    # Récupérer le document à l'index spécifié
    document = template["documents"][document_index]
    
    # Log du document sélectionné
    logger.info(f"Document sélectionné: {document.get('titre', 'Sans titre')}")
    
    # Récupérer le contenu du document depuis Google Docs
    try:
        doc_id = extract_doc_id_from_url(document.get('google_doc_id', ''))
        logger.info(f"Récupération du contenu du document depuis Google Docs: {doc_id}")
        doc_content = get_google_doc_content(doc_id)
        logger.info(f"Contenu récupéré avec succès, longueur: {len(doc_content)} caractères")
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du contenu du document: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du contenu du document: {str(e)}")
    
    # Remplacer les variables par les valeurs
    valeurs_variables = entreprise["valeurs_variables"]
    doc_content_with_values = replace_variables(doc_content, valeurs_variables)
    
    # Générer le document au format demandé
    if format.lower() == "pdf":
        content, content_type = generate_pdf(doc_content_with_values, entreprise["type"])
        filename = f"{document.get('titre', 'document')}_{entreprise_id}.pdf"
    elif format.lower() == "docx":
        if not DOCX_AVAILABLE:
            raise HTTPException(status_code=501, detail="Export Word non disponible. Veuillez installer python-docx.")
        content, content_type = generate_docx(doc_content_with_values, entreprise["type"])
        filename = f"{document.get('titre', 'document')}_{entreprise_id}.docx"
    else:
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez 'pdf' ou 'docx'")
    
    # Retourner le document
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

def replace_variables(content: str, variables: dict) -> str:
    """
    Remplace les variables dans le contenu par leurs valeurs.
    """
    for key, value in variables.items():
        placeholder = "{{" + key + "}}"
        content = content.replace(placeholder, str(value))
    
    # Rechercher les variables non remplacées
    remaining_vars = re.findall(r'{{(.*?)}}', content)
    
    # Remplacer les variables restantes par des espaces vides
    for var in remaining_vars:
        content = content.replace("{{" + var + "}}", "___________")
    
    return content

def generate_pdf(content: str, entreprise_type: str) -> tuple:
    """
    Génère un document PDF à partir du contenu.
    """
    buffer = io.BytesIO()
    
    # Créer un document PDF
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    
    
    # Préparer les éléments du document
    elements = []
    

    
    # Diviser le contenu en paragraphes et les ajouter au document
    paragraphs = content.split('\n')
    for para in paragraphs:
        if para.strip():
            try:
                elements.append(Paragraph(para.strip()))
            except Exception as e:
                # Si un paragraphe pose problème, l'ajouter comme texte brut
                logger.warning(f"Erreur lors de l'ajout d'un paragraphe: {e}")
                elements.append(Paragraph(f"[Contenu formaté non supporté]"))
    
    # Construire le document
    doc.build(elements)
    
    # Récupérer le contenu du buffer
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content, "application/pdf"

def generate_docx(content: str, entreprise_type: str) -> tuple:
    """
    Génère un document DOCX à partir du contenu.
    """
    # Créer un document Word
    doc = Document()
    
    # Diviser le contenu en paragraphes
    paragraphs = content.split('\n')
    for para in paragraphs:
        if para.strip():
            doc.add_paragraph(para.strip())
    
    # Enregistrer le document dans un buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    
    # Récupérer le contenu du buffer
    docx_content = buffer.getvalue()
    buffer.close()
    
    return docx_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# Ajout d'un endpoint de diagnostic pour aider au débogage
@router.get("/debug/{entreprise_id}")
async def debug_document_export(
    entreprise_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Endpoint de diagnostic pour aider à déboguer les problèmes d'exportation de documents.
    """
    if current_user["role"] != "expert" and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Seuls les experts et administrateurs peuvent accéder à cette fonctionnalité")
    
    # Récupérer l'entreprise
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        return {"error": "Entreprise non trouvée", "entreprise_id": entreprise_id}
    
    # Vérifier le template_id
    template_id = entreprise.get("template_id")
    template_info = {"template_id": template_id}
    
    if not template_id:
        template_info["error"] = "Pas de template_id dans l'entreprise"
    else:
        # Essayer de récupérer le template
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        template = await templates_db.get_by_id(template_id)
        
        if not template:
            template_info["error"] = f"Template {template_id} non trouvé dans la base de données"
        else:
            template_info["found"] = True
            template_info["titre"] = template.get("titre")
            template_info["type_entreprise"] = template.get("type_entreprise")
            template_info["statut"] = template.get("statut")
            template_info["google_doc_id"] = template.get("google_doc_id")
            
            # Tester l'accès au document Google Docs
            try:
                doc_id = extract_doc_id_from_url(template.get("google_doc_id", ""))
                template_info["google_doc_id_extracted"] = doc_id
                
                # Essayer de récupérer le contenu (juste pour tester)
                content_preview = get_google_doc_content(doc_id)
                template_info["google_docs_access"] = "OK"
                template_info["content_preview"] = content_preview[:100] + "..." if len(content_preview) > 100 else content_preview
            except Exception as e:
                template_info["google_docs_access"] = "ERROR"
                template_info["google_docs_error"] = str(e)
    
    # Vérifier les templates disponibles pour ce type d'entreprise
    templates_db = CouchDB(TEMPLATES_COLLECTION)
    available_templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
    
    return {
        "entreprise": {
            "id": entreprise["id"],
            "type": entreprise["type"],
            "statut": entreprise["statut"],
            "template_id": entreprise.get("template_id")
        },
        "template_info": template_info,
        "available_templates": [
            {"id": t["id"], "titre": t["titre"], "google_doc_id": t.get("google_doc_id")} 
            for t in available_templates
        ],
        "valeurs_variables": entreprise.get("valeurs_variables", {})
    }

# Endpoint pour tester directement l'accès à un document Google Docs
@router.get("/test-google-doc/{doc_id}")
async def test_google_doc_access(
    doc_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Teste l'accès à un document Google Docs et retourne un aperçu du contenu.
    """
    if current_user["role"] != "expert" and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Seuls les experts et administrateurs peuvent accéder à cette fonctionnalité")
    
    try:
        # Extraire l'ID du document si c'est une URL
        doc_id = extract_doc_id_from_url(doc_id)
        
        # Récupérer le contenu
        content = get_google_doc_content(doc_id)
        
        # Retourner un aperçu du contenu
        return {
            "status": "success",
            "doc_id": doc_id,
            "content_length": len(content),
            "content_preview": content[:500] + "..." if len(content) > 500 else content
        }
    except Exception as e:
        logger.error(f"Erreur lors du test d'accès au document Google Docs: {e}")
        return {
            "status": "error",
            "doc_id": doc_id,
            "error": str(e)
        }


@router.get("/available/{entreprise_id}")
async def get_available_documents(
    entreprise_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Retourne la liste des documents disponibles pour une entreprise."""
    # Vérifier que l'utilisateur est autorisé (client propriétaire ou expert)
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Vérifier que l'utilisateur est le propriétaire de l'entreprise ou un expert
    if current_user["role"] != "expert" and current_user["id"] != entreprise["client_id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accéder à ce document")
    
    # Vérifier que l'entreprise est validée
    if entreprise["statut"] != "validé":
        raise HTTPException(status_code=400, detail="L'entreprise doit être validée pour accéder aux documents")
    
    # Récupérer le template associé à l'entreprise
    template_id = entreprise.get("template_id")
    
    if not template_id:
        # Si template_id n'existe pas, utiliser le type d'entreprise pour trouver un template
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
        
        if not templates:
            return {"documents": []}
        
        template = templates[0]
    else:
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        template = await templates_db.get_by_id(template_id)
        
        if not template:
            # Essayer de trouver un template par type si le template_id ne fonctionne pas
            templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
            
            if not templates:
                return {"documents": []}
            
            template = templates[0]
    
    # Retourner la liste des documents disponibles avec leur index
    return {
        "documents": [
            {
                "index": idx,
                "titre": doc.get("titre", f"Document {idx+1}"),
                "description": doc.get("description", ""),
            }
            for idx, doc in enumerate(template.get("documents", []))
        ]
    }