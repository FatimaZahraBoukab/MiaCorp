from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
import uuid
import base64
import os
from datetime import datetime
import mimetypes

from ..couchdb import CouchDB
from ..models import (
    Conversation, ConversationCreate, Message, MessageCreate, ConversationSummary,
    MessageAttachment, MessageAttachmentCreate
)
from .auth import get_current_active_user

router = APIRouter(
    prefix="/conversations",
    tags=["conversations"],
    responses={404: {"description": "Not found"}},
)

CONVERSATIONS_COLLECTION = "conversations"
MESSAGES_COLLECTION = "messages"
ENTREPRISES_COLLECTION = "entreprises"
USERS_COLLECTION = "users"
ATTACHMENTS_COLLECTION = "message_attachments"

# Configuration pour les fichiers
UPLOAD_DIR = "uploads/conversations"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    'archives': ['.zip', '.rar', '.7z']
}

# Créer le dossier d'upload s'il n'existe pas
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_file_type(filename: str) -> str:
    """Détermine le type de fichier basé sur l'extension"""
    ext = os.path.splitext(filename.lower())[1]
    
    if ext in ALLOWED_EXTENSIONS['images']:
        return 'image'
    elif ext in ALLOWED_EXTENSIONS['documents']:
        return 'document'
    elif ext in ALLOWED_EXTENSIONS['archives']:
        return 'archive'
    else:
        return 'other'

def is_allowed_file(filename: str) -> bool:
    """Vérifie si le fichier est autorisé"""
    ext = os.path.splitext(filename.lower())[1]
    all_extensions = []
    for extensions in ALLOWED_EXTENSIONS.values():
        all_extensions.extend(extensions)
    return ext in all_extensions

async def save_attachment(attachment_data: MessageAttachmentCreate, message_id: str) -> MessageAttachment:
    """Sauvegarde un attachement et retourne les informations"""
    
    # Décoder le contenu base64
    try:
        file_content = base64.b64decode(attachment_data.contenu_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Contenu de fichier invalide")
    
    # Vérifier la taille
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10MB)")
    
    # Vérifier l'extension
    if not is_allowed_file(attachment_data.nom_fichier):
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé")
    
    # Générer un nom unique pour le fichier
    attachment_id = str(uuid.uuid4())
    file_extension = os.path.splitext(attachment_data.nom_fichier)[1]
    unique_filename = f"{attachment_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Sauvegarder le fichier
    try:
        with open(file_path, 'wb') as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur lors de la sauvegarde du fichier")
    
    # Créer l'objet attachment
    attachment = MessageAttachment(
        id=attachment_id,
        nom_fichier=attachment_data.nom_fichier,
        type_fichier=get_file_type(attachment_data.nom_fichier),
        taille_fichier=len(file_content),
        url_fichier=file_path,
        date_upload=datetime.now()
    )
    
    # Sauvegarder les métadonnées en base
    attachments_db = CouchDB(ATTACHMENTS_COLLECTION)
    attachment_doc = {
        "id": attachment.id,
        "message_id": message_id,
        "nom_fichier": attachment.nom_fichier,
        "type_fichier": attachment.type_fichier,
        "taille_fichier": attachment.taille_fichier,
        "url_fichier": attachment.url_fichier,
        "date_upload": attachment.date_upload.isoformat()
    }
    await attachments_db.create(attachment_doc)
    
    return attachment

@router.post("/", response_model=Conversation)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Créer une nouvelle conversation pour une entreprise"""
    
    # Vérifier que l'entreprise existe
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(conversation_data.entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Vérifier les permissions
    if current_user["role"] == "client" and entreprise["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Vérifier si une conversation existe déjà pour cette entreprise
    conversations_db = CouchDB(CONVERSATIONS_COLLECTION)
    existing_conversations = await conversations_db.query({"entreprise_id": conversation_data.entreprise_id})
    
    if existing_conversations:
        # Retourner la conversation existante avec ses messages
        conversation = existing_conversations[0]
        messages_db = CouchDB(MESSAGES_COLLECTION)
        messages = await messages_db.query({"conversation_id": conversation["id"]})
        
        # Charger les attachements pour chaque message
        for message in messages:
            attachments_db = CouchDB(ATTACHMENTS_COLLECTION)
            attachments = await attachments_db.query({"message_id": message["id"]})
            message["attachments"] = attachments
        
        messages.sort(key=lambda x: x["date_envoi"])
        conversation["messages"] = messages
        return conversation
    
    # Créer une nouvelle conversation
    new_conversation = {
        "id": str(uuid.uuid4()),
        "entreprise_id": conversation_data.entreprise_id,
        "client_id": entreprise["client_id"],
        "expert_id": None,
        "sujet": conversation_data.sujet,
        "date_creation": datetime.now().isoformat(),
        "derniere_activite": datetime.now().isoformat(),
        "statut": "active",
        "non_lus_client": 0,
        "non_lus_expert": 0
    }
    
    created_conversation = await conversations_db.create(new_conversation)
    created_conversation["messages"] = []
    
    return created_conversation

@router.get("/entreprise/{entreprise_id}", response_model=Conversation)
async def get_conversation_by_entreprise(
    entreprise_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Récupérer la conversation d'une entreprise"""
    
    # Vérifier que l'entreprise existe
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    entreprise = await entreprises_db.get_by_id(entreprise_id)
    
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")
    
    # Vérifier les permissions
    if current_user["role"] == "client" and entreprise["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Récupérer la conversation
    conversations_db = CouchDB(CONVERSATIONS_COLLECTION)
    conversations = await conversations_db.query({"entreprise_id": entreprise_id})
    
    if not conversations:
        raise HTTPException(status_code=404, detail="Aucune conversation trouvée")
    
    conversation = conversations[0]
    
    # Récupérer les messages
    messages_db = CouchDB(MESSAGES_COLLECTION)
    messages = await messages_db.query({"conversation_id": conversation["id"]})
    
    # Charger les attachements pour chaque message
    attachments_db = CouchDB(ATTACHMENTS_COLLECTION)
    for message in messages:
        attachments = await attachments_db.query({"message_id": message["id"]})
        message["attachments"] = attachments
    
    # Trier les messages par date
    messages.sort(key=lambda x: x["date_envoi"])
    
    conversation["messages"] = messages
    
    return conversation

@router.post("/{conversation_id}/messages", response_model=Message)
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Envoyer un message dans une conversation avec support des attachements"""
    
    # Vérifier que la conversation existe
    conversations_db = CouchDB(CONVERSATIONS_COLLECTION)
    conversation = await conversations_db.get_by_id(conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Vérifier les permissions et assigner l'expert si nécessaire
    if current_user["role"] == "client" and conversation["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission refusée")
    elif current_user["role"] == "expert":
        if conversation.get("expert_id") is None:
            # Assigner cet expert à la conversation
            conversation["expert_id"] = current_user["id"]
            await conversations_db.update(conversation_id, conversation)
        elif conversation.get("expert_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Cette conversation est assignée à un autre expert")
    
    # Créer le message
    message_id = str(uuid.uuid4())
    new_message = {
        "id": message_id,
        "conversation_id": conversation_id,
        "expediteur_id": current_user["id"],
        "expediteur_nom": f"{current_user['prenom']} {current_user['nom']}",
        "expediteur_role": current_user["role"],
        "contenu": message_data.contenu,
        "date_envoi": datetime.now().isoformat(),
        "lu": False
    }
    
    # Traiter les attachements s'il y en a
    attachments = []
    if message_data.attachments:
        for attachment_data in message_data.attachments:
            try:
                attachment = await save_attachment(attachment_data, message_id)
                attachments.append(attachment.dict())
            except Exception as e:
                # Si un attachement échoue, on continue avec les autres
                print(f"Erreur lors de la sauvegarde de l'attachement: {e}")
                continue
    
    # Sauvegarder le message
    messages_db = CouchDB(MESSAGES_COLLECTION)
    created_message = await messages_db.create(new_message)
    created_message["attachments"] = attachments
    
    # Mettre à jour la conversation
    conversation["derniere_activite"] = datetime.now().isoformat()
    
    # Incrémenter le compteur de messages non lus pour l'autre partie
    if current_user["role"] == "client":
        conversation["non_lus_expert"] = conversation.get("non_lus_expert", 0) + 1
    else:
        conversation["non_lus_client"] = conversation.get("non_lus_client", 0) + 1
    
    await conversations_db.update(conversation_id, conversation)
    
    return created_message

@router.get("/attachments/{attachment_id}")
async def download_attachment(
    attachment_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Télécharger un attachement"""
    
    # Récupérer les métadonnées de l'attachement
    attachments_db = CouchDB(ATTACHMENTS_COLLECTION)
    attachment = await attachments_db.get_by_id(attachment_id)
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachement non trouvé")
    
    # Vérifier les permissions (l'utilisateur doit avoir accès à la conversation)
    messages_db = CouchDB(MESSAGES_COLLECTION)
    message = await messages_db.get_by_id(attachment["message_id"])
    
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    conversations_db = CouchDB(CONVERSATIONS_COLLECTION)
    conversation = await conversations_db.get_by_id(message["conversation_id"])
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Vérifier que l'utilisateur a accès à cette conversation
    if (current_user["role"] == "client" and conversation["client_id"] != current_user["id"]) and \
       (current_user["role"] == "expert" and conversation.get("expert_id") != current_user["id"]):
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Vérifier que le fichier existe
    file_path = attachment["url_fichier"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé sur le serveur")
    
    # Retourner le fichier
    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        filename=attachment["nom_fichier"],
        media_type=mimetypes.guess_type(attachment["nom_fichier"])[0]
    )

@router.put("/{conversation_id}/mark-read")
async def mark_messages_as_read(
    conversation_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Marquer tous les messages d'une conversation comme lus"""
    
    conversations_db = CouchDB(CONVERSATIONS_COLLECTION)
    conversation = await conversations_db.get_by_id(conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Vérifier les permissions
    if (current_user["role"] == "client" and conversation["client_id"] != current_user["id"]) and \
       (current_user["role"] == "expert" and conversation.get("expert_id") != current_user["id"]):
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    # Réinitialiser le compteur de messages non lus
    if current_user["role"] == "client":
        conversation["non_lus_client"] = 0
    else:
        conversation["non_lus_expert"] = 0
    
    await conversations_db.update(conversation_id, conversation)
    
    return {"message": "Messages marqués comme lus"}

@router.get("/", response_model=List[ConversationSummary])
async def get_user_conversations(
    current_user: dict = Depends(get_current_active_user)
):
    """Récupérer toutes les conversations de l'utilisateur"""
    
    conversations_db = CouchDB(CONVERSATIONS_COLLECTION)
    
    if current_user["role"] == "client":
        conversations = await conversations_db.query({"client_id": current_user["id"]})
    elif current_user["role"] == "expert":
        conversations = await conversations_db.query({"expert_id": current_user["id"]})
    else:
        conversations = await conversations_db.read_all()
    
    # Enrichir avec les informations des entreprises et utilisateurs
    entreprises_db = CouchDB(ENTREPRISES_COLLECTION)
    users_db = CouchDB(USERS_COLLECTION)
    messages_db = CouchDB(MESSAGES_COLLECTION)
    
    enriched_conversations = []
    
    for conv in conversations:
        # Récupérer l'entreprise
        entreprise = await entreprises_db.get_by_id(conv["entreprise_id"])
        
        # Récupérer le client
        client = await users_db.get_by_id(conv["client_id"])
        
        # Récupérer l'expert si assigné
        expert = None
        if conv.get("expert_id"):
            expert = await users_db.get_by_id(conv["expert_id"])
        
        # Récupérer le dernier message
        messages = await messages_db.query({"conversation_id": conv["id"]})
        dernier_message = None
        if messages:
            messages.sort(key=lambda x: x["date_envoi"], reverse=True)
            dernier_message = messages[0]["contenu"][:50] + "..." if len(messages[0]["contenu"]) > 50 else messages[0]["contenu"]
        
        # Déterminer le nombre de messages non lus pour l'utilisateur actuel
        non_lus = 0
        if current_user["role"] == "client":
            non_lus = conv.get("non_lus_client", 0)
        else:
            non_lus = conv.get("non_lus_expert", 0)
        
        enriched_conv = {
            "id": conv["id"],
            "entreprise_id": conv["entreprise_id"],
            "entreprise_type": entreprise["type"] if entreprise else "Inconnu",
            "client_nom": f"{client['prenom']} {client['nom']}" if client else "Client inconnu",
            "expert_nom": f"{expert['prenom']} {expert['nom']}" if expert else "Aucun expert assigné",
            "sujet": conv["sujet"],
            "derniere_activite": conv["derniere_activite"],
            "dernier_message": dernier_message,
            "non_lus": non_lus,
            "statut": conv["statut"]
        }
        
        enriched_conversations.append(enriched_conv)
    
    # Trier par dernière activité
    enriched_conversations.sort(key=lambda x: x["derniere_activite"], reverse=True)
    
    return enriched_conversations
