import aiohttp
from typing import List, Dict, Any, Optional, Union
import uuid
import json
from datetime import datetime
import os
import logging
import aiohttp

# Configurer le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CouchDB:
    def __init__(self, database_name: str):
        # Configuration de CouchDB - utiliser des variables d'environnement en production
        self.base_url = os.environ.get("COUCHDB_URL", "http://localhost:5984")
        self.username = os.environ.get("COUCHDB_USER", "BOUKAB")
        self.password = os.environ.get("COUCHDB_PASSWORD", "BOUKAB123")
        self.database = database_name
        self.auth = aiohttp.BasicAuth(self.username, self.password)

    async def _ensure_database_exists(self):
        """S'assure que la base de données existe, la crée si nécessaire."""
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}"
            async with session.head(url) as response:
                if response.status == 404:
                    # Base de données non trouvée, on la crée
                    async with session.put(url) as create_response:
                        if create_response.status not in (201, 202):
                            response_data = await create_response.json()
                            logger.error(f"Erreur lors de la création de la base de données: {response_data}")
                            raise Exception(f"Erreur lors de la création de la base de données: {response_data}")
                        logger.info(f"Base de données {self.database} créée avec succès")

    async def read_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupère tous les documents avec pagination."""
        await self._ensure_database_exists()
        
        async with aiohttp.ClientSession(auth=self.auth) as session:
            # Utilisation de _all_docs pour récupérer tous les documents
            url = f"{self.base_url}/{self.database}/_all_docs"
            params = {
                "include_docs": "true",
                "limit": limit,
                "skip": skip
            }
            
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la récupération des documents: {error_text}")
                    raise Exception(f"Erreur lors de la récupération des documents: {response.status}")
                
                data = await response.json()
                # Extraction des documents de la réponse
                documents = [row["doc"] for row in data.get("rows", [])]
                
                # Formatage pour correspondre à la structure MongoDB
                for doc in documents:
                    if "_id" in doc:
                        doc["id"] = doc.pop("_id")
                    if "_rev" in doc:
                        doc.pop("_rev")  # On retire le champ _rev qui est spécifique à CouchDB
                
                return documents

    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        """Récupère un document par son ID."""
        await self._ensure_database_exists()
        
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/{id}"
            
            async with session.get(url) as response:
                if response.status == 404:
                    return None
                elif response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la récupération du document {id}: {error_text}")
                    raise Exception(f"Erreur lors de la récupération du document: {response.status}")
                
                document = await response.json()
                
                # Formatage pour correspondre à la structure MongoDB
                if "_id" in document:
                    document["id"] = document.pop("_id")
                if "_rev" in document:
                    document.pop("_rev")
                
                return document

    async def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouveau document."""
        await self._ensure_database_exists()
        
        # S'assurer qu'un ID est présent
        if "id" in item:
            item_id = item["id"]
            # Copier le dictionnaire pour ne pas modifier l'original
            item_copy = {k: v for k, v in item.items() if k != "id"}
            item_copy["_id"] = item_id
            item = item_copy
        elif "_id" not in item:
            item = item.copy()  # Copier pour ne pas modifier l'original
            item["_id"] = str(uuid.uuid4())
        
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/{item['_id']}"
            headers = {"Content-Type": "application/json"}
            
            # Convertir les datetime en ISO format
            item_json = self._prepare_json(item)
            
            async with session.put(url, json=item_json, headers=headers) as response:
                if response.status not in (201, 202):
                    response_data = await response.text()
                    logger.error(f"Erreur lors de la création du document: {response_data}")
                    raise Exception(f"Erreur lors de la création du document: {response_data}")
                
                result = await response.json()
                item["_rev"] = result["rev"]  # Mise à jour du _rev
                
                # Formatage pour correspondre à la structure MongoDB
                return_item = item.copy()
                if "_id" in return_item:
                    return_item["id"] = return_item.pop("_id")
                if "_rev" in return_item:
                    return_item.pop("_rev")
                
                return return_item

    def _prepare_json(self, obj: Any) -> Any:
        """Prépare les objets pour la sérialisation JSON."""
        if isinstance(obj, dict):
            return {k: self._prepare_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._prepare_json(item) for item in obj]
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return obj

    async def update(self, id: str, updated_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Met à jour un document existant."""
        await self._ensure_database_exists()
        
        # Récupérer le document actuel pour obtenir la révision
        current_doc = None
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/{id}"
            
            async with session.get(url) as response:
                if response.status == 404:
                    return None
                elif response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la récupération du document {id}: {error_text}")
                    raise Exception(f"Erreur lors de la récupération du document: {response.status}")
                
                current_doc = await response.json()
        
        if not current_doc:
            return None
        
        # Préparer le document mis à jour
        rev = current_doc["_rev"]
        
        # Nettoyer les données
        updated_item_copy = updated_item.copy()
        if "id" in updated_item_copy:
            updated_item_copy.pop("id")
        if "_id" in updated_item_copy:
            updated_item_copy.pop("_id")
        if "_rev" in updated_item_copy:
            updated_item_copy.pop("_rev")
        
        # Convertir les datetime en ISO format
        updated_item_json = self._prepare_json(updated_item_copy)
        
        # Fusionner les documents
        merged_doc = {**current_doc, **updated_item_json}
        merged_doc["_rev"] = rev  # Conserver la révision
        
        # Mettre à jour le document
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/{id}"
            headers = {"Content-Type": "application/json"}
            
            async with session.put(url, json=merged_doc, headers=headers) as response:
                if response.status not in (201, 202):
                    response_data = await response.text()
                    logger.error(f"Erreur lors de la mise à jour du document {id}: {response_data}")
                    raise Exception(f"Erreur lors de la mise à jour du document: {response_data}")
                
                # Récupérer le document mis à jour
                return await self.get_by_id(id)

    async def delete(self, id: str) -> bool:
        """Supprime un document par son ID."""
        await self._ensure_database_exists()
        
        # Récupérer le document pour obtenir sa révision
        current_doc = None
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/{id}"
            
            async with session.get(url) as response:
                if response.status == 404:
                    return False
                elif response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la récupération du document {id}: {error_text}")
                    raise Exception(f"Erreur lors de la récupération du document: {response.status}")
                
                current_doc = await response.json()
        
        if not current_doc:
            return False
        
        # Supprimer le document
        rev = current_doc["_rev"]
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/{id}"
            params = {"rev": rev}
            
            async with session.delete(url, params=params) as response:
                if response.status not in (200, 202):
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la suppression du document {id}: {error_text}")
                    return False
                
                return True

    async def query(self, filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Recherche des documents selon des critères spécifiques.
        
        Cette méthode utilise l'API Mango de CouchDB pour effectuer des requêtes.
        """
        await self._ensure_database_exists()
        
        # Conversion du filtre en sélecteur Mango
        selector = {}
        for key, value in filter_dict.items():
            selector[key] = {"$eq": value}
        
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/_find"
            
            find_query = {
                "selector": selector,
                "limit": 100  # Limite par défaut
            }
            
            async with session.post(url, json=find_query) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la recherche de documents: {error_text}")
                    raise Exception(f"Erreur lors de la recherche de documents: {response.status}")
                
                data = await response.json()
                documents = data.get("docs", [])
                
                # Formatage pour correspondre à la structure MongoDB
                for doc in documents:
                    if "_id" in doc:
                        doc["id"] = doc.pop("_id")
                    if "_rev" in doc:
                        doc.pop("_rev")
                
                return documents

    async def bulk_create(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Crée plusieurs documents en une seule opération."""
        await self._ensure_database_exists()
        
        # Préparer les documents
        docs_to_create = []
        
        for item in items:
            item_copy = item.copy()
            
            # S'assurer qu'un ID est présent
            if "id" in item_copy:
                item_id = item_copy.pop("id")
                item_copy["_id"] = item_id
            elif "_id" not in item_copy:
                item_copy["_id"] = str(uuid.uuid4())
            
            # Convertir les datetime en ISO format
            docs_to_create.append(self._prepare_json(item_copy))
        
        # Exécuter l'opération bulk
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/_bulk_docs"
            data = {"docs": docs_to_create}
            
            async with session.post(url, json=data) as response:
                if response.status not in (201, 202):
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la création en masse: {error_text}")
                    raise Exception(f"Erreur lors de la création en masse: {response.status}")
                
                results = await response.json()
                
                # Formatage des résultats
                created_items = []
                for i, result in enumerate(results):
                    if "ok" in result:
                        item = docs_to_create[i].copy()
                        item["id"] = item.pop("_id")
                        if "_rev" in item:
                            item.pop("_rev")
                        created_items.append(item)
                
                return created_items

    async def create_index(self, fields: List[str], name: str = None) -> Dict[str, Any]:
        """Crée un index pour accélérer les requêtes."""
        await self._ensure_database_exists()
        
        index_def = {
            "index": {
                "fields": fields
            },
            "ddoc": name or f"idx_{self.database}_{'_'.join(fields)}",
            "name": name or f"idx_{'_'.join(fields)}",
            "type": "json"
        }
        
        async with aiohttp.ClientSession(auth=self.auth) as session:
            url = f"{self.base_url}/{self.database}/_index"
            
            async with session.post(url, json=index_def) as response:
                if response.status not in (200, 201):
                    error_text = await response.text()
                    logger.error(f"Erreur lors de la création de l'index: {error_text}")
                    raise Exception(f"Erreur lors de la création de l'index: {response.status}")
                
                result = await response.json()
                return result