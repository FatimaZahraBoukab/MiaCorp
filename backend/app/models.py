from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from enum import Enum 
from datetime import datetime
import uuid

# User Models
class UserBase(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    telephone: Optional[str] = None
    acceptEmails: Optional[bool] = False

class UserCreate(UserBase):
    mot_de_passe: str
    role: str = "client"

class User(UserBase):
    id: str
    date_inscription: datetime
    est_actif: bool = True
    role: str

    class Config:
        orm_mode = True

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Client Models
class ClientBase(UserBase):
    adresse: Optional[str] = None
    entreprise: Optional[str] = None
    siret: Optional[str] = None

class ClientCreate(UserCreate, ClientBase):
    pass

class Client(User, ClientBase):
    pass

# Expert Juridique Models
class ExpertJuridiqueBase(UserBase):
    numero_professionnel: str

class ExpertJuridiqueCreate(UserCreate, ExpertJuridiqueBase):
    pass

class ExpertJuridique(User, ExpertJuridiqueBase):
    pass

class TypeEntreprise(str, Enum):
    SAS = "SAS"
    SARL = "SARL"
    SASU = "SASU"
    EURL = "EURL"

class Entreprise(BaseModel):
    id: str
    type: TypeEntreprise
    client_id: str
    date_creation: datetime
    statut: str = "en_attente"
    valeurs_variables: Dict[str, str]

class TemplateVariable(BaseModel):
    id: str
    nom: str
    description: Optional[str] = None
    type: str
    obligatoire: bool = True
    valeur_defaut: Optional[str] = None

class GoogleDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titre: str
    google_doc_id: str
    google_doc_url: str
    variables: Optional[List[TemplateVariable]] = []

class DocumentTemplate(BaseModel):
    id: str
    titre: str
    description: Optional[str] = None
    type_entreprise: TypeEntreprise
    documents: List[GoogleDocument]
    variables: List[TemplateVariable]
    est_actif: bool = True
    statut: str = "en_attente"
    date_creation: datetime

class DocumentTemplateCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    type_entreprise: TypeEntreprise
    documents: List[GoogleDocument]

class Document(BaseModel):
    id: str
    template_id: str
    entreprise_id: str
    client_id: str
    valeurs_variables: Dict[str, str]
    google_doc_id: Optional[str] = None
    statut: str = "brouillon"
    commentaires: Optional[str] = None
    expert_id: Optional[str] = None
    date_creation: datetime
    date_modification: Optional[datetime] = None
    date_validation: Optional[datetime] = None

class EntrepriseCreate(BaseModel):
    type: TypeEntreprise
    template_id: str
    valeurs_variables: Dict[str, str]

# Message de contact
class ContactMessageCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    message: str
    lu: bool = False
    date_envoi: Optional[datetime] = Field(default_factory=datetime.utcnow)

class ContactMessage(ContactMessageCreate):
    id: str

# NOUVEAUX MODÈLES POUR LES ATTACHEMENTS
class MessageAttachment(BaseModel):
    id: str
    nom_fichier: str
    type_fichier: str  # image, document, pdf, etc.
    taille_fichier: int  # en bytes
    url_fichier: str  # chemin vers le fichier stocké
    date_upload: datetime

class MessageAttachmentCreate(BaseModel):
    nom_fichier: str
    type_fichier: str
    taille_fichier: int
    contenu_base64: str  # contenu du fichier en base64

# MODÈLES DE MESSAGES MODIFIÉS
class MessageCreate(BaseModel):
    contenu: str
    conversation_id: str
    attachments: Optional[List[MessageAttachmentCreate]] = []

class Message(BaseModel):
    id: str
    conversation_id: str
    expediteur_id: str
    expediteur_nom: str
    expediteur_role: str
    contenu: str
    date_envoi: datetime
    lu: bool = False
    attachments: List[MessageAttachment] = []  # NOUVEAU CHAMP

class ConversationCreate(BaseModel):
    entreprise_id: str
    sujet: Optional[str] = "Discussion sur la demande"

class Conversation(BaseModel):
    id: str
    entreprise_id: str
    client_id: str
    expert_id: Optional[str] = None
    sujet: str
    date_creation: datetime
    derniere_activite: datetime
    statut: str = "active"
    messages: List[Message] = []
    non_lus_client: int = 0
    non_lus_expert: int = 0

class ConversationSummary(BaseModel):
    id: str
    entreprise_id: str
    entreprise_type: str
    client_nom: str
    expert_nom: Optional[str] = None
    sujet: str
    derniere_activite: datetime
    dernier_message: Optional[str] = None
    non_lus: int = 0
    statut: str
