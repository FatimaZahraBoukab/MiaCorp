from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel
from app.routers import users, auth, templates, entreprises
from app.routers import contact
from app.routers import documents_export


# Initialize FastAPI app
app = FastAPI(
    title="Document Juridique API",
    description="API pour la gestion automatisée de documents juridiques",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates.router)
app.include_router(entreprises.router)


# JWT Configuration
SECRET_KEY = "your-secret-key"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 400

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

COUCHDB_URL = "http://localhost:5984"

# MongoDB collections
USERS_COLLECTION = "users"
MODELS_COLLECTION = "models"
VARIABLES_COLLECTION = "variables"
DOCUMENTS_COLLECTION = "documents"
NOTIFICATIONS_COLLECTION = "notifications"

# Include routers
from app.routers import users, auth

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contact.router)
app.include_router(documents_export.router)

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de gestion de documents juridiques"}
