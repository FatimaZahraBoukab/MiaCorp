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


