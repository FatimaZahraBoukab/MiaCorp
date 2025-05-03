from fastapi import APIRouter, HTTPException
from app.models import ContactMessageCreate, ContactMessage  

from app.couchdb import CouchDB

from typing import List
import uuid

router = APIRouter()
db = CouchDB("contact")  # Nom de la base dans CouchDB

@router.post("/contact/", response_model=ContactMessage)
async def create_message(msg: ContactMessageCreate):
    item = msg.dict()
    item["id"] = str(uuid.uuid4())
    created = await db.create(item)
    return created

@router.get("/contact/", response_model=List[ContactMessage])
async def list_messages():
    return await db.read_all()

@router.delete("/contact/{msg_id}")
async def delete_message(msg_id: str):
    deleted = await db.delete(msg_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return {"detail": "Message supprimé"}

@router.put("/contact/{msg_id}/lu")
async def mark_as_read(msg_id: str):
    existing = await db.get_by_id(msg_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Message introuvable")
    existing["lu"] = True
    updated = await db.update(msg_id, existing)
    return updated
