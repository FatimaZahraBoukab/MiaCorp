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

class UserCreate(UserBase):
    mot_de_passe: str
    role: str = "client"  # Default role is client

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

class Entreprise(BaseModel):
    id: str
    nom: str
    type: TypeEntreprise
    client_id: str
    date_creation: datetime
    siret: Optional[str] = None
    adresse: Optional[str] = None
    capital: float
    description: Optional[str] = None
    statut: str = "en_attente"  # en_attente, actif, inactif

class TemplateVariable(BaseModel):
    id: str
    nom: str
    description: Optional[str] = None
    type: str  # text, number, date, etc.
    obligatoire: bool = True
    valeur_defaut: Optional[str] = None

class DocumentTemplate(BaseModel):
    id: str
    titre: str
    description: Optional[str] = None
    type_entreprise: TypeEntreprise
    google_doc_id: str
    google_doc_url: str  # URL complète
    variables: List[TemplateVariable]
    est_actif: bool = True
    statut: str = "en_attente"
    date_creation: datetime

class DocumentTemplateCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    type_entreprise: TypeEntreprise
    google_doc_id: str
    #variables: Optional[List[TemplateVariable]] 


class Document(BaseModel):
    id: str
    template_id: str
    entreprise_id: str
    client_id: str
    valeurs_variables: Dict[str, str]
    google_doc_id: Optional[str] = None  # ID du document généré
    statut: str = "brouillon"  # brouillon, en_review, validé, rejeté
    commentaires: Optional[str] = None
    expert_id: Optional[str] = None
    date_creation: datetime
    date_modification: Optional[datetime] = None
    date_validation: Optional[datetime] = None

class EntrepriseCreate(BaseModel):
    nom: str
    type: TypeEntreprise
    siret: Optional[str] = None
    adresse: Optional[str] = None
    capital: float
    description: Optional[str] = None
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
