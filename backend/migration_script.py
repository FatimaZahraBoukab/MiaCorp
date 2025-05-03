import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import aiohttp
import json
from datetime import datetime

# Configuration MongoDB
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "legal_docs_db"

# Configuration CouchDB
COUCHDB_URL = "http://localhost:5984"
COUCHDB_USER = "BOUKAB"
COUCHDB_PASSWORD = "BOUKAB123"

# Collections à migrer
COLLECTIONS = ["users", "templates", "documents", "dossiers", "forms", "fields", "journal", "notifications"]

async def ensure_database_exists(session, db_name):
    """S'assurer que la base de données existe dans CouchDB"""
    url = f"{COUCHDB_URL}/{db_name}"
    async with session.head(url) as response:
        if response.status == 404:
            # Créer la base
            async with session.put(url) as create_response:
                if create_response.status not in (201, 202):
                    response_data = await create_response.json()
                    raise Exception(f"Erreur lors de la création de la base {db_name}: {response_data}")
                print(f"Base de données {db_name} créée avec succès")
        else:
            print(f"Base de données {db_name} existe déjà")

async def migrate_collection(collection_name):
    print(f"Migration de la collection {collection_name}...")
    
    # Connexion à MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    collection = db[collection_name]
    
    # Récupération des documents
    documents = await collection.find().to_list(length=None)
    print(f"Trouvé {len(documents)} documents dans MongoDB.")
    
    # Préparation des documents pour CouchDB
    couchdb_docs = []
    for doc in documents:
        # Convertir ObjectId en string
        if "_id" in doc:
            doc["_id"] = str(doc.pop("_id"))
        # Si un champ 'id' existe déjà, l'utiliser comme _id
        elif "id" in doc:
            doc["_id"] = doc["id"]
            # Garder id pour compatibilité avec l'API existante
        
        # Convertir les dates en format ISO
        for key, value in doc.items():
            if isinstance(value, datetime):
                doc[key] = value.isoformat()
        
        couchdb_docs.append(doc)
    
    # Utilisation de l'API bulk docs pour insertion en masse
    auth = aiohttp.BasicAuth(COUCHDB_USER, COUCHDB_PASSWORD)
    async with aiohttp.ClientSession(auth=auth) as session:
        # S'assurer que la base existe
        await ensure_database_exists(session, collection_name)
        
        # Insertion en masse
        if couchdb_docs:
            url = f"{COUCHDB_URL}/{collection_name}/_bulk_docs"
            bulk_request = {"docs": couchdb_docs}
            async with session.post(url, json=bulk_request) as response:
                if response.status not in (201, 202):
                    error = await response.text()
                    print(f"Erreur lors de l'insertion en masse: {error}")
                else:
                    results = await response.json()
                    success_count = sum(1 for res in results if "ok" in res)
                    error_count = len(results) - success_count
                    print(f"Insertion en masse terminée: {success_count} succès, {error_count} erreurs")

    print(f"Migration de {collection_name} terminée.")

async def verify_migration(collection_name):
    """Vérifier que tous les documents ont été migrés correctement"""
    print(f"Vérification de la migration pour {collection_name}...")
    
    # Connexion à MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    collection = db[collection_name]
    
    # Compter les documents dans MongoDB
    mongo_count = await collection.count_documents({})
    
    # Compter les documents dans CouchDB
    auth = aiohttp.BasicAuth(COUCHDB_USER, COUCHDB_PASSWORD)
    async with aiohttp.ClientSession(auth=auth) as session:
        url = f"{COUCHDB_URL}/{collection_name}/_all_docs"
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                couch_count = data.get("total_rows", 0)
                print(f"Collection {collection_name}: {mongo_count} documents dans MongoDB, {couch_count} dans CouchDB")
                if mongo_count != couch_count:
                    print(f"⚠️ Attention: Nombre de documents différent pour {collection_name}")
            else:
                print(f"⚠️ Erreur lors de la vérification de {collection_name}")

async def main():
    try:
        # Migration des collections
        for collection in COLLECTIONS:
            await migrate_collection(collection)
        
        # Vérification de la migration
        print("\nVérification de la migration:")
        for collection in COLLECTIONS:
            await verify_migration(collection)
            
        print("\nMigration terminée avec succès!")
    except Exception as e:
        print(f"Erreur lors de la migration: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())