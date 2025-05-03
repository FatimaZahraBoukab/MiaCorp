# google_docs.py (dans le dossier utils)
import os
from typing import Dict
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration Google Docs API
SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'google-credentials.json'

def get_google_docs_service():
    """Obtenez un service Google Docs API autorisé."""
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('docs', 'v1', credentials=credentials)
    return service

def get_google_drive_service():
    """Obtenez un service Google Drive API autorisé."""
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('drive', 'v3', credentials=credentials)
    return service

async def generate_document(template_doc_id: str, variables: Dict[str, str]):
    """Génère un nouveau document Google Docs à partir d'un modèle et de variables."""
    docs_service = get_google_docs_service()
    drive_service = get_google_drive_service()
    
    # Copier le document template
    drive_response = drive_service.files().copy(
        fileId=template_doc_id,
        body={'name': f'Generated Document - {variables.get("nom_entreprise", "Untitled")}'}).execute()
    
    new_doc_id = drive_response.get('id')
    
    # Remplacer les variables dans le document
    requests = []
    for var_name, var_value in variables.items():
        requests.append({
            'replaceAllText': {
                'containsText': {
                    'text': f'{{{{ {var_name} }}}}',
                    'matchCase': True
                },
                'replaceText': var_value
            }
        })
    
    if requests:
        docs_service.documents().batchUpdate(
            documentId=new_doc_id, 
            body={'requests': requests}).execute()
    
    return new_doc_id

async def get_document_preview(template_doc_id: str, variables: Dict[str, str]):
    """Génère un aperçu HTML du document."""
    # Pour une vraie implémentation, vous pourriez utiliser une bibliothèque comme 
    # mammoth.js pour convertir le document en HTML
    
    # Ici, nous simulons simplement l'aperçu
    doc_id = await generate_document(template_doc_id, variables)
    
    # Créer un HTML de prévisualisation simple
    preview_html = f"""
    <div class="document-preview">
        <iframe src="https://docs.google.com/document/d/{doc_id}/preview" width="100%" height="600"></iframe>
    </div>
    """
    
    return preview_html