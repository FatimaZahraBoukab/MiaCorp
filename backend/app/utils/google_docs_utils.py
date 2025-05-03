# google_docs_utils.py
import re
from googleapiclient.discovery import build
from google.oauth2 import service_account

SCOPES = ['https://www.googleapis.com/auth/documents.readonly']
#SERVICE_ACCOUNT_FILE = 'backend/credentials/credentials.json'
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, '../../credentials/credentials.json')


def extract_doc_id_from_url(url: str) -> str:
    """Extracts the document ID from a Google Doc URL."""
    if '/d/' in url:
        doc_id = url.split('/d/')[1].split('/')[0]
        # Remove any query parameters
        doc_id = doc_id.split('?')[0]
        return doc_id
    return url  # If it's already just an ID

"""def get_google_doc_content(doc_id):
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build('docs', 'v1', credentials=creds)
    doc = service.documents().get(documentId=doc_id).execute()
    
    text_content = []
    for element in doc.get('body', {}).get('content', []):
        if 'paragraph' in element:
            for elem in element['paragraph']['elements']:
                if 'textRun' in elem:
                    text_content.append(elem['textRun']['content'])
    
    return ''.join(text_content)"""

def get_google_doc_content(doc_url_or_id):
    """Récupère le contenu textuel brut d'un document Google Docs"""
    # Extract the doc ID if a URL was provided
    doc_id = extract_doc_id_from_url(doc_url_or_id)
    
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build('docs', 'v1', credentials=creds)
    doc = service.documents().get(documentId=doc_id).execute()
    
    text_content = []
    for element in doc.get('body', {}).get('content', []):
        if 'paragraph' in element:
            for elem in element['paragraph']['elements']:
                if 'textRun' in elem:
                    text_content.append(elem['textRun']['content'])
    
    return ''.join(text_content)

"""def extract_variables_from_doc(doc_id):
    content = get_google_doc_content(doc_id)
    variables = re.findall(r"\{\{(.*?)\}\}", content)
    return list(set(variables))"""

def extract_variables_from_doc(doc_url_or_id):
    # Extract the doc ID if a URL was provided
    doc_id = extract_doc_id_from_url(doc_url_or_id)
    
    content = get_google_doc_content(doc_id)
    variables = re.findall(r"\{\{(.*?)\}\}", content)
    return list(set(variables))