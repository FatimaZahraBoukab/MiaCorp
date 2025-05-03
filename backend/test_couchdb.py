import asyncio
import random
import string
from app.couchdb import CouchDB

# Collection de test
TEST_COLLECTION = "test_couchdb"

async def generate_random_user():
    """Génère un utilisateur aléatoire pour les tests"""
    return {
        "id": ''.join(random.choices(string.ascii_lowercase + string.digits, k=10)),
        "nom": ''.join(random.choices(string.ascii_uppercase, k=6)),
        "prenom": ''.join(random.choices(string.ascii_uppercase, k=8)),
        "email": f"{''.join(random.choices(string.ascii_lowercase, k=8))}@example.com",
        "telephone": f"+33{random.randint(100000000, 999999999)}",
        "role": random.choice(["admin", "client", "expert"])
    }

async def test_crud_operations():
    """Teste les opérations CRUD de base sur CouchDB"""
    print("Test des opérations CRUD sur CouchDB...")
    
    # Initialiser la connexion
    db = CouchDB(TEST_COLLECTION)
    
    # 1. Créer un utilisateur
    user = await generate_random_user()
    print(f"Création de l'utilisateur: {user['email']}")
    created_user = await db.create(user)
    print(f"✅ Utilisateur créé avec l'ID: {created_user['id']}")
    
    # 2. Lire l'utilisateur
    user_id = created_user['id']
    read_user = await db.get_by_id(user_id)
    if read_user and read_user['email'] == user['email']:
        print(f"✅ Lecture réussie pour l'utilisateur: {read_user['email']}")
    else:
        print("❌ Échec de la lecture")
    
    # 3. Mettre à jour l'utilisateur
    update_data = {"nom": "NOUVEAU_NOM", "telephone": "+33987654321"}
    updated_user = await db.update(user_id, update_data)
    if updated_user and updated_user['nom'] == "NOUVEAU_NOM":
        print(f"✅ Mise à jour réussie: {updated_user['nom']}")
    else:
        print("❌ Échec de la mise à jour")
    
    # 4. Récupérer tous les utilisateurs
    all_users = await db.read_all(limit=10)
    print(f"✅ Récupération de {len(all_users)} utilisateurs")
    
    # 5. Requête
    query_result = await db.query({"email": user['email']})
    if query_result and len(query_result) > 0:
        print(f"✅ Requête réussie, trouvé: {query_result[0]['email']}")
    else:
        print("❌ Échec de la requête")
    
    # 6. Suppression
    deleted = await db.delete(user_id)
    if deleted:
        print(f"✅ Suppression réussie de l'utilisateur: {user_id}")
    else:
        print("❌ Échec de la suppression")
    
    # Vérifier que l'utilisateur est bien supprimé
    deleted_user = await db.get_by_id(user_id)
    if not deleted_user:
        print("✅ Vérification de suppression réussie")
    else:
        print("❌ L'utilisateur existe toujours après suppression")

async def test_bulk_operations():
    """Teste les opérations en masse"""
    print("\nTest des opérations en masse...")
    
    db = CouchDB(TEST_COLLECTION)
    
    # Générer plusieurs utilisateurs
    users = [await generate_random_user() for _ in range(5)]
    created_users = []
    
    # Création
    for user in users:
        created = await db.create(user)
        created_users.append(created)
    
    print(f"✅ Création de {len(created_users)} utilisateurs")
    
    # Liste des IDs créés
    user_ids = [user['id'] for user in created_users]
    
    # Lire tous les utilisateurs créés
    all_users = await db.read_all()
    test_users = [u for u in all_users if u['id'] in user_ids]
    print(f"✅ Lecture de {len(test_users)} utilisateurs de test")
    
    # Nettoyage: supprimer tous les utilisateurs de test
    for user_id in user_ids:
        await db.delete(user_id)
    
    print("✅ Nettoyage terminé")

async def main():
    try:
        print("Démarrage des tests CouchDB...")
        await test_crud_operations()
        await test_bulk_operations()
        print("\nTous les tests sont terminés avec succès!")
    except Exception as e:
        print(f"❌ Erreur lors des tests: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())