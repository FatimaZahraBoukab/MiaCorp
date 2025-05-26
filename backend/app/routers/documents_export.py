from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional
from ..couchdb import CouchDB
from .auth import get_current_active_user
import io
import re
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus.flowables import HRFlowable
import logging
from ..utils.google_docs_utils import get_google_doc_content, extract_doc_id_from_url

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pour les documents Word, utilisez python-docx
try:
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    from docx.oxml.shared import OxmlElement, qn
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
    document_index: int = 0,
    format: str = "pdf",
    current_user: dict = Depends(get_current_active_user)
):
    """
    Exporte un document au format PDF ou DOCX avec les variables remplacées par les valeurs du client.
    Le paramètre document_index permet de spécifier quel document du template exporter.
    """
    # [Keeping the existing validation logic unchanged]
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    logger.info(f"Entreprise trouvée: {entreprise_id}")
    logger.info(f"Template ID associé: {entreprise.get('template_id', 'Non défini')}")
    logger.info(f"Document index demandé: {document_index}")
    
    if current_user["role"] != "expert" and current_user["id"] != entreprise["client_id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accéder à ce document")
    
    if entreprise["statut"] != "validé":
        raise HTTPException(status_code=400, detail="L'entreprise doit être validée pour exporter le document")
    
    # [Template retrieval logic remains the same]
    if "template_id" not in entreprise or not entreprise["template_id"]:
        logger.warning(f"Pas de template_id dans l'entreprise {entreprise_id}, recherche par type")
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
        
        if not templates:
            raise HTTPException(
                status_code=404, 
                detail=f"Aucun template trouvé pour le type d'entreprise {entreprise['type']}"
            )
        
        template = templates[0]
        logger.info(f"Template trouvé par type: {template['id']}")
    else:
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        template = await templates_db.get_by_id(entreprise["template_id"])
        
        if not template:
            logger.warning(f"Template {entreprise['template_id']} non trouvé, recherche par type")
            templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
            
            if not templates:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Template {entreprise['template_id']} non trouvé et aucun template alternatif disponible"
                )
            
            template = templates[0]
            logger.info(f"Template alternatif trouvé: {template['id']}")
    
    if not template.get("documents") or len(template["documents"]) <= document_index:
        raise HTTPException(
            status_code=404, 
            detail=f"Document à l'index {document_index} non trouvé dans le template"
        )
    
    document = template["documents"][document_index]
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
    
    # Générer le document au format demandé avec le nouveau formatage
    if format.lower() == "pdf":
        content, content_type = generate_beautiful_pdf(
            doc_content_with_values, 
            entreprise["type"], 
            document.get('titre', 'Document'), 
            entreprise
        )
        filename = f"{document.get('titre', 'document')}_{entreprise_id}.pdf"
    elif format.lower() == "docx":
        if not DOCX_AVAILABLE:
            raise HTTPException(status_code=501, detail="Export Word non disponible. Veuillez installer python-docx.")
        content, content_type = generate_beautiful_docx(
            doc_content_with_values, 
            entreprise["type"], 
            document.get('titre', 'Document'), 
            entreprise
        )
        filename = f"{document.get('titre', 'document')}_{entreprise_id}.docx"
    else:
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez 'pdf' ou 'docx'")
    
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
    
    remaining_vars = re.findall(r'{{(.*?)}}', content)
    
    for var in remaining_vars:
        content = content.replace("{{" + var + "}}", "___________")
    
    return content

def create_custom_styles():
    """
    Crée des styles personnalisés pour les documents PDF.
    """
    styles = getSampleStyleSheet()
    
    # Style pour le titre principal
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        spaceBefore=20,
        textColor=colors.HexColor('#2C3E50'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Style pour les sous-titres
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=18,
        spaceAfter=20,
        spaceBefore=15,
        textColor=colors.HexColor('#34495E'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    # Style pour les sections
    section_style = ParagraphStyle(
        'CustomSection',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=12,
        textColor=colors.HexColor('#2980B9'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    # Style pour le texte normal avec meilleur espacement
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        spaceBefore=6,
        textColor=colors.HexColor('#2C3E50'),
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
        leading=14
    )
    
    # Style pour les éléments importants
    highlight_style = ParagraphStyle(
        'CustomHighlight',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=10,
        spaceBefore=10,
        textColor=colors.HexColor('#E74C3C'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        backColor=colors.HexColor('#FCF3CF'),
        borderColor=colors.HexColor('#F39C12'),
        borderWidth=1,
        borderPadding=8
    )
    
    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'section': section_style,
        'normal': normal_style,
        'highlight': highlight_style
    }

def parse_content_structure(content: str):
    """
    Parse le contenu pour identifier les titres, sections et paragraphes.
    """
    lines = content.split('\n')
    structured_content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Détecter les titres (lignes en majuscules ou commençant par des mots-clés)
        if (line.isupper() and len(line) > 3) or any(line.upper().startswith(keyword) for keyword in ['TITRE', 'CHAPITRE', 'SECTION']):
            structured_content.append({'type': 'title', 'content': line})
        # Détecter les sous-titres (lignes avec première lettre en majuscule et certains patterns)
        elif (line[0].isupper() and ':' in line) or any(line.startswith(keyword) for keyword in ['Article', 'Clause', 'Paragraphe']):
            structured_content.append({'type': 'subtitle', 'content': line})
        # Détecter les sections (lignes commençant par des numéros)
        elif re.match(r'^\d+\.', line) or re.match(r'^[A-Z]\)', line):
            structured_content.append({'type': 'section', 'content': line})
        # Détecter les éléments importants (lignes avec mots-clés spéciaux)
        elif any(keyword in line.upper() for keyword in ['IMPORTANT', 'ATTENTION', 'NOTE', 'REMARQUE']):
            structured_content.append({'type': 'highlight', 'content': line})
        else:
            structured_content.append({'type': 'normal', 'content': line})
    
    return structured_content

def generate_beautiful_pdf(content: str, entreprise_type: str, document_title: str, entreprise: dict) -> tuple:
    """
    Génère un document PDF magnifiquement formaté.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2*cm
    )
    
    # Créer les styles personnalisés
    custom_styles = create_custom_styles()
    elements = []
    
    # En-tête du document avec informations de l'entreprise
    header_data = [
        ['Entreprise:', entreprise.get('nom', 'N/A')],
        ['Type:', entreprise_type],
        ['Date:', '___________'],
        ['Document:', document_title]
    ]
    
    header_table = Table(header_data, colWidths=[3*cm, 6*cm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDC3C7')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 20))
    
    # Ligne de séparation décorative
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3498DB')))
    elements.append(Spacer(1, 20))
    
    # Titre principal du document
    elements.append(Paragraph(document_title, custom_styles['title']))
    elements.append(Spacer(1, 10))
    
    # Ligne de séparation sous le titre
    elements.append(HRFlowable(width="60%", thickness=1, color=colors.HexColor('#95A5A6')))
    elements.append(Spacer(1, 20))
    
    # Parser et formater le contenu
    structured_content = parse_content_structure(content)
    
    for item in structured_content:
        content_type = item['type']
        content_text = item['content']
        
        try:
            if content_type == 'title':
                elements.append(Spacer(1, 15))
                elements.append(Paragraph(content_text, custom_styles['title']))
                elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#3498DB')))
                elements.append(Spacer(1, 10))
                
            elif content_type == 'subtitle':
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(content_text, custom_styles['subtitle']))
                elements.append(Spacer(1, 8))
                
            elif content_type == 'section':
                elements.append(Paragraph(content_text, custom_styles['section']))
                elements.append(Spacer(1, 6))
                
            elif content_type == 'highlight':
                elements.append(Spacer(1, 8))
                elements.append(Paragraph(content_text, custom_styles['highlight']))
                elements.append(Spacer(1, 8))
                
            else:  # normal
                elements.append(Paragraph(content_text, custom_styles['normal']))
                
        except Exception as e:
            logger.warning(f"Erreur lors du formatage d'un paragraphe: {e}")
            elements.append(Paragraph(f"[Contenu: {content_text[:50]}...]", custom_styles['normal']))
    
    # Pied de page avec ligne de séparation
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3498DB')))
    elements.append(Spacer(1, 10))
    
    footer_style = ParagraphStyle(
        'Footer',
        fontSize=9,
        textColor=colors.HexColor('#7F8C8D'),
        alignment=TA_CENTER
    )
    elements.append(Paragraph("Document généré automatiquement", footer_style))
    
    # Construire le document
    doc.build(elements)
    
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content, "application/pdf"

def generate_beautiful_docx(content: str, entreprise_type: str, document_title: str, entreprise: dict) -> tuple:
    """
    Génère un document DOCX magnifiquement formaté.
    """
    doc = Document()
    
    # Configurer les styles du document
    styles = doc.styles
    
    # Style pour le titre principal
    title_style = styles.add_style('CustomTitle', WD_STYLE_TYPE.PARAGRAPH)
    title_font = title_style.font
    title_font.name = 'Calibri'
    title_font.size = Pt(24)
    title_font.bold = True
    title_font.color.rgb = RGBColor(44, 62, 80)  # #2C3E50
    title_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_style.paragraph_format.space_after = Pt(20)
    
    # Style pour les sous-titres
    subtitle_style = styles.add_style('CustomSubtitle', WD_STYLE_TYPE.PARAGRAPH)
    subtitle_font = subtitle_style.font
    subtitle_font.name = 'Calibri'
    subtitle_font.size = Pt(18)
    subtitle_font.bold = True
    subtitle_font.color.rgb = RGBColor(52, 73, 94)  # #34495E
    subtitle_style.paragraph_format.space_after = Pt(12)
    subtitle_style.paragraph_format.space_before = Pt(12)
    
    # Style pour les sections
    section_style = styles.add_style('CustomSection', WD_STYLE_TYPE.PARAGRAPH)
    section_font = section_style.font
    section_font.name = 'Calibri'
    section_font.size = Pt(14)
    section_font.bold = True
    section_font.color.rgb = RGBColor(41, 128, 185)  # #2980B9
    section_style.paragraph_format.space_after = Pt(8)
    section_style.paragraph_format.space_before = Pt(8)
    
    # Style pour le texte normal
    normal_style = styles.add_style('CustomNormal', WD_STYLE_TYPE.PARAGRAPH)
    normal_font = normal_style.font
    normal_font.name = 'Calibri'
    normal_font.size = Pt(11)
    normal_font.color.rgb = RGBColor(44, 62, 80)  # #2C3E50
    normal_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal_style.paragraph_format.space_after = Pt(6)
    
    # Ajouter l'en-tête avec informations de l'entreprise
    header_table = doc.add_table(rows=4, cols=2)
    header_table.style = 'Table Grid'
    
    header_data = [
        ('Entreprise:', entreprise.get('nom', 'N/A')),
        ('Type:', entreprise_type),
        ('Date:', '___________'),
        ('Document:', document_title)
    ]
    
    for i, (label, value) in enumerate(header_data):
        row = header_table.rows[i]
        row.cells[0].text = label
        row.cells[1].text = value
        # Mettre en gras la première colonne
        row.cells[0].paragraphs[0].runs[0].font.bold = True
    
    # Espacement après le tableau
    doc.add_paragraph()
    
    # Ajouter une ligne de séparation (simulée avec des caractères)
    separator = doc.add_paragraph('─' * 50)
    separator.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Titre principal
    title_para = doc.add_paragraph(document_title)
    title_para.style = title_style
    
    # Ligne de séparation sous le titre
    separator2 = doc.add_paragraph('─' * 30)
    separator2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Parser et ajouter le contenu structuré
    structured_content = parse_content_structure(content)
    
    for item in structured_content:
        content_type = item['type']
        content_text = item['content']
        
        if content_type == 'title':
            doc.add_paragraph()  # Espacement
            para = doc.add_paragraph(content_text)
            para.style = title_style
            # Ajouter une ligne de séparation
            sep = doc.add_paragraph('─' * 50)
            sep.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
        elif content_type == 'subtitle':
            para = doc.add_paragraph(content_text)
            para.style = subtitle_style
            
        elif content_type == 'section':
            para = doc.add_paragraph(content_text)
            para.style = section_style
            
        elif content_type == 'highlight':
            para = doc.add_paragraph(content_text)
            para.style = normal_style
            # Ajouter une couleur de fond (approximation)
            run = para.runs[0] if para.runs else para.add_run()
            run.font.bold = True
            run.font.color.rgb = RGBColor(231, 76, 60)  # #E74C3C
            
        else:  # normal
            para = doc.add_paragraph(content_text)
            para.style = normal_style
    
    # Ajouter un pied de page
    doc.add_paragraph()
    separator3 = doc.add_paragraph('─' * 50)
    separator3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    footer = doc.add_paragraph("Document généré automatiquement")
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.runs[0].font.size = Pt(9)
    footer.runs[0].font.color.rgb = RGBColor(127, 140, 141)  # #7F8C8D
    
    # Enregistrer le document dans un buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    
    docx_content = buffer.getvalue()
    buffer.close()
    
    return docx_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# [Keeping all the existing debug and utility endpoints unchanged]
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
    
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        return {"error": "Entreprise non trouvée", "entreprise_id": entreprise_id}
    
    template_id = entreprise.get("template_id")
    template_info = {"template_id": template_id}
    
    if not template_id:
        template_info["error"] = "Pas de template_id dans l'entreprise"
    else:
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
            
            try:
                doc_id = extract_doc_id_from_url(template.get("google_doc_id", ""))
                template_info["google_doc_id_extracted"] = doc_id
                
                content_preview = get_google_doc_content(doc_id)
                template_info["google_docs_access"] = "OK"
                template_info["content_preview"] = content_preview[:100] + "..." if len(content_preview) > 100 else content_preview
            except Exception as e:
                template_info["google_docs_access"] = "ERROR"
                template_info["google_docs_error"] = str(e)
    
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
        doc_id = extract_doc_id_from_url(doc_id)
        content = get_google_doc_content(doc_id)
        
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
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    if current_user["role"] != "expert" and current_user["id"] != entreprise["client_id"]:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accéder à ce document")
    
    if entreprise["statut"] != "validé":
        raise HTTPException(status_code=400, detail="L'entreprise doit être validée pour accéder aux documents")
    
    template_id = entreprise.get("template_id")
    
    if not template_id:
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
        
        if not templates:
            return {"documents": []}
        
        template = templates[0]
    else:
        templates_db = CouchDB(TEMPLATES_COLLECTION)
        template = await templates_db.get_by_id(template_id)
        
        if not template:
            templates = await templates_db.query({"type_entreprise": entreprise["type"], "statut": "validé"})
            
            if not templates:
                return {"documents": []}
            
            template = templates[0]
    
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



    