from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import List, Dict, Any, Optional
import json
import os

# Classe MongoDB pour l'utilisation avec MongoDB
class MongoDB:
    def __init__(self, collection_name: str):
        # Connexion à MongoDB
        self.client = AsyncIOMotorClient("mongodb://localhost:27017")
        self.db = self.client.legal_docs_db
        self.collection = self.db[collection_name]
    
    async def read_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        cursor = self.collection.find().skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        # Convertir ObjectId en str pour la sérialisation JSON
        for doc in documents:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
        return documents
    
    
    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"id": id})


    
    async def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        # Si l'item a déjà un ID, l'utiliser comme _id
        if "id" in item:
            item_id = item.pop("id")
            try:
                item["_id"] = ObjectId(item_id)
            except:
                item["_id"] = item_id
        
        result = await self.collection.insert_one(item)
        item["id"] = str(result.inserted_id)
        if "_id" in item:
            del item["_id"]
        return item
    
    async def update(self, id: str, updated_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            # Supprimer l'id de l'item mis à jour pour éviter les doublons
            if "id" in updated_item:
                del updated_item["id"]
            
            # Essayer d'abord avec ObjectId
            try:
                result = await self.collection.update_one(
                    {"_id": ObjectId(id)}, {"$set": updated_item}
                )
            except:
                # Essayer avec l'id comme chaîne
                result = await self.collection.update_one(
                    {"id": id}, {"$set": updated_item}
                )
            
            if result.matched_count > 0:
                updated_doc = await self.get_by_id(id)
                return updated_doc
        except Exception as e:
            print(f"Erreur lors de la mise à jour: {e}")
        return None
    
    async def delete(self, id: str) -> bool:
        try:
            # Essayer d'abord avec ObjectId
            try:
                result = await self.collection.delete_one({"_id": ObjectId(id)})
            except:
                # Essayer avec l'id comme chaîne
                result = await self.collection.delete_one({"id": id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Erreur lors de la suppression: {e}")
            return False
    
    async def query(self, filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        cursor = self.collection.find(filter_dict)
        documents = await cursor.to_list(length=100)
        # Convertir ObjectId en str pour la sérialisation JSON
        for doc in documents:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
        return documents

# Classe JSONDatabase pour la compatibilité avec le code existant
class JSONDatabase:
    def __init__(self, file_path: str):
        self.file_path = file_path
        if not os.path.exists(file_path):
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                json.dump([], f)
    
    def read_all(self) -> List[Dict[str, Any]]:
        with open(self.file_path, "r") as f:
            return json.load(f)
    
    def write_all(self, data: List[Dict[str, Any]]) -> None:
        with open(self.file_path, "w") as f:
            json.dump(data, f, indent=2)
    
    def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        data = self.read_all()
        for item in data:
            if item.get("id") == id:
                return item
        return None
    
    def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        data = self.read_all()
        data.append(item)
        self.write_all(data)
        return item
    
    def update(self, id: str, updated_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = self.read_all()
        for i, item in enumerate(data):
            if item.get("id") == id:
                data[i] = updated_item
                self.write_all(data)
                return updated_item
        return None
    
    def delete(self, id: str) -> bool:
        data = self.read_all()
        initial_length = len(data)
        data = [item for item in data if item.get("id") != id]
        if len(data) < initial_length:
            self.write_all(data)
            return True
        return False
    
    def query(self, filter_func) -> List[Dict[str, Any]]:
        data = self.read_all()
        return [item for item in data if filter_func(item)]
