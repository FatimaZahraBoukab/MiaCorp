from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional
from ..couchdb import CouchDB
from .auth import get_current_active_user

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    responses={404: {"description": "Not found"}},
)

DOCUMENTS_COLLECTION = "documents"

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Vérifier que l'utilisateur est un expert
    if current_user["role"] != "expert":
        raise HTTPException(status_code=403, detail="Seuls les experts peuvent accéder aux documents")
    
    db = CouchDB(DOCUMENTS_COLLECTION)
    document = await db.get_by_id(document_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    # Vérifier si c'est une pièce d'identité
    if document.get("type") != "piece_identite":
        raise HTTPException(status_code=400, detail="Ce document n'est pas une pièce d'identité")
    
    # Convertir le contenu en bytes
    try:
        content_bytes = document["content"].encode('latin1')
        
        # Retourner le contenu comme une réponse binaire
        return Response(
            content=content_bytes,
            media_type="image/jpeg",  # Spécifier le type de média correct
            headers={
                "Content-Disposition": f"inline; filename=piece_identite_{document_id}.jpg"
            }
        )
    except Exception as e:
        print(f"Erreur lors de la conversion du contenu: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion du contenu: {str(e)}")
