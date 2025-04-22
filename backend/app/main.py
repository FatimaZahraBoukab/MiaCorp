from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel
from app.routers import users, auth

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



# JWT Configuration
SECRET_KEY = "your-secret-key"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# MongoDB connection string
MONGODB_URL = "mongodb://localhost:27017"

# MongoDB collections
USERS_COLLECTION = "users"
MODELS_COLLECTION = "models"
VARIABLES_COLLECTION = "variables"
DOCUMENTS_COLLECTION = "documents"
DOSSIERS_COLLECTION = "dossiers"
FORMS_COLLECTION = "forms"
FIELDS_COLLECTION = "fields"
JOURNAL_COLLECTION = "journal"
NOTIFICATIONS_COLLECTION = "notifications"

# Include routers
from app.routers import users, auth

app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de gestion de documents juridiques"}

