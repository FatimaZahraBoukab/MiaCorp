"""
Endpoint d'administration pour nettoyer la base de données.
"""

from fastapi import APIRouter, Depends, HTTPException
from .auth import get_current_active_user
from ..couchdb import CouchDB

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/cleanup-template-variables")
async def cleanup_template_variables(current_user=Depends(get_current_active_user)):
    """Nettoie les variables de templates en supprimant les marqueurs de boucles et conditions."""
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent effectuer cette opération")
    
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
    
    cleanup_stats = {
        "templates_processed": 0,
        "templates_updated": 0,
        "variables_removed": 0,
        "removed_variables": []
    }
    
    for template in templates:
        cleanup_stats["templates_processed"] += 1
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
                        cleanup_stats["removed_variables"].append({
                            "template": template.get('titre', 'Sans titre'),
                            "variable": var_name,
                            "location": "template_level"
                        })
                        break
                
                if not should_exclude:
                    cleaned_variables.append(variable)
            
            if len(cleaned_variables) != original_count:
                template['variables'] = cleaned_variables
                template_updated = True
                cleanup_stats["variables_removed"] += (original_count - len(cleaned_variables))
        
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
                                cleanup_stats["removed_variables"].append({
                                    "template": template.get('titre', 'Sans titre'),
                                    "document": doc.get('titre', 'Sans titre'),
                                    "variable": var_name,
                                    "location": "document_level"
                                })
                                break
                        
                        if not should_exclude:
                            cleaned_variables.append(variable)
                    
                    if len(cleaned_variables) != original_count:
                        doc['variables'] = cleaned_variables
                        template_updated = True
                        cleanup_stats["variables_removed"] += (original_count - len(cleaned_variables))
        
        # Sauvegarder le template nettoyé
        if template_updated:
            await db.update(template['id'], template)
            cleanup_stats["templates_updated"] += 1
    
    return {
        "status": "success",
        "message": "Nettoyage terminé avec succès",
        "stats": cleanup_stats
    }

@router.get("/template-variables-audit")
async def audit_template_variables(current_user=Depends(get_current_active_user)):
    """Audit des variables de templates pour identifier les problèmes."""
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent effectuer cette opération")
    
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
    
    audit_results = {
        "total_templates": len(templates),
        "problematic_templates": [],
        "total_problematic_variables": 0
    }
    
    for template in templates:
        template_issues = {
            "template_id": template.get('id'),
            "template_title": template.get('titre', 'Sans titre'),
            "problematic_variables": []
        }
        
        # Vérifier les variables du template
        if 'variables' in template:
            for variable in template['variables']:
                var_name = variable.get('nom', '')
                for pattern in excluded_patterns:
                    if pattern in var_name:
                        template_issues["problematic_variables"].append({
                            "variable": var_name,
                            "location": "template_level",
                            "pattern_matched": pattern
                        })
                        audit_results["total_problematic_variables"] += 1
        
        # Vérifier les variables des documents
        if 'documents' in template:
            for doc in template['documents']:
                if 'variables' in doc:
                    for variable in doc['variables']:
                        var_name = variable.get('nom', '')
                        for pattern in excluded_patterns:
                            if pattern in var_name:
                                template_issues["problematic_variables"].append({
                                    "variable": var_name,
                                    "location": f"document: {doc.get('titre', 'Sans titre')}",
                                    "pattern_matched": pattern
                                })
                                audit_results["total_problematic_variables"] += 1
        
        if template_issues["problematic_variables"]:
            audit_results["problematic_templates"].append(template_issues)
    
    return audit_results
