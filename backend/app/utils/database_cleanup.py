"""
Script de nettoyage pour supprimer les variables de boucles et conditions 
qui ont été incorrectement enregistrées dans la base de données.
"""

import asyncio
from ..couchdb import CouchDB

async def clean_template_variables():
    """Nettoie les variables de templates en supprimant les marqueurs de boucles et conditions."""
    
    db = CouchDB("templates")
    templates = await db.read_all()
    
    excluded_patterns = [
        '#LOOP_', '/LOOP_',
        '#IF_', '/IF_', 
        '{{#', '{{/',
        '#LOOP_ACTIONNAIRES', '/LOOP_ACTIONNAIRES',
        '#LOOP_GERANTS', '/LOOP_GERANTS',
        '#LOOP_PRESIDENTS', '/LOOP_PRESIDENTS', 
        '#IF_GERANT', '/IF_GERANT',
        '#IF_PRESIDENT', '/IF_PRESIDENT'
    ]
    
    for template in templates:
        template_updated = False
        
        # Nettoyer les variables du template
        if 'variables' in template:
            original_count = len(template['variables'])
            cleaned_variables = []
            
            for variable in template['variables']:
                var_name = variable.get('nom', '')
                should_exclude = False
                
                for pattern in excluded_patterns:
                    if pattern in var_name:
                        should_exclude = True
                        print(f"Suppression de la variable: {var_name} du template {template.get('titre', 'Sans titre')}")
                        break
                
                if not should_exclude:
                    cleaned_variables.append(variable)
            
            if len(cleaned_variables) != original_count:
                template['variables'] = cleaned_variables
                template_updated = True
                print(f"Template {template.get('titre')}: {original_count - len(cleaned_variables)} variables supprimées")
        
        # Nettoyer les variables des documents
        if 'documents' in template:
            for doc in template['documents']:
                if 'variables' in doc:
                    original_count = len(doc['variables'])
                    cleaned_variables = []
                    
                    for variable in doc['variables']:
                        var_name = variable.get('nom', '')
                        should_exclude = False
                        
                        for pattern in excluded_patterns:
                            if pattern in var_name:
                                should_exclude = True
                                print(f"Suppression de la variable: {var_name} du document {doc.get('titre', 'Sans titre')}")
                                break
                        
                        if not should_exclude:
                            cleaned_variables.append(variable)
                    
                    if len(cleaned_variables) != original_count:
                        doc['variables'] = cleaned_variables
                        template_updated = True
                        print(f"Document {doc.get('titre')}: {original_count - len(cleaned_variables)} variables supprimées")
        
        # Sauvegarder le template nettoyé
        if template_updated:
            await db.update(template['id'], template)
            print(f"Template {template.get('titre')} mis à jour dans la base de données")

if __name__ == "__main__":
    asyncio.run(clean_template_variables())
