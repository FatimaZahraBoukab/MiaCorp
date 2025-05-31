import re
from typing import Dict, List, Any
import json
import logging

logger = logging.getLogger(__name__)

def process_shareholder_loops(content: str, variables: Dict[str, Any]) -> str:
    """
    Traite les boucles d'actionnaires dans le contenu Google Docs.
    
    CORRECTION: Traite maintenant toutes les boucles (ACTIONNAIRES, GERANTS, PRESIDENTS)
    et gère correctement la variable nombre_actions_associe.
    """
    
    # Patterns pour détecter les différentes boucles
    loop_patterns = {
        'ACTIONNAIRES': r'{{#LOOP_ACTIONNAIRES}}(.*?){{/LOOP_ACTIONNAIRES}}',
        'GERANTS': r'{{#LOOP_GERANTS}}(.*?){{/LOOP_GERANTS}}',
        'PRESIDENTS': r'{{#LOOP_PRESIDENTS}}(.*?){{/LOOP_PRESIDENTS}}'
    }
    
    processed_content = content
    
    # Traiter chaque type de boucle
    for loop_type, pattern in loop_patterns.items():
        processed_content = process_single_loop_type(processed_content, pattern, loop_type, variables)
    
    # Traiter aussi les variables individuelles restantes
    processed_content = process_individual_shareholder_variables(processed_content, variables)
    
    return processed_content

def process_single_loop_type(content: str, pattern: str, loop_type: str, variables: Dict[str, Any]) -> str:
    """Traite un type de boucle spécifique."""
    
    def replace_loop(match):
        loop_content = match.group(1).strip()
        logger.info(f"Traitement de la boucle {loop_type}")
        
        # Récupérer la liste des actionnaires
        actionnaires_data = get_shareholders_data(variables)
        
        if not actionnaires_data:
            logger.warning(f"Aucune donnée d'actionnaires trouvée pour la boucle {loop_type}")
            return ""
        
        logger.info(f"Trouvé {len(actionnaires_data)} actionnaires pour la boucle {loop_type}")
        
        # Générer le contenu pour chaque actionnaire
        result_content = []
        for i, actionnaire in enumerate(actionnaires_data, 1):
            actionnaire_content = loop_content
            
            # Remplacer les variables pour cet actionnaire
            for key, value in actionnaire.items():
                if key != 'id':
                    placeholder = f"{{{{{key}}}}}"
                    actionnaire_content = actionnaire_content.replace(placeholder, str(value))
            
            # Remplacer les variables avec index
            for key, value in actionnaire.items():
                if key != 'id':
                    placeholder_with_index = f"{{{{{key}_{i}}}}}"
                    actionnaire_content = actionnaire_content.replace(placeholder_with_index, str(value))
            
            result_content.append(actionnaire_content)
        
        return '\n\n'.join(result_content)
    
    return re.sub(pattern, replace_loop, content, flags=re.DOTALL)

def get_shareholders_data(variables: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Récupère les données des actionnaires depuis les variables."""
    
    # Essayer d'abord avec la liste JSON
    if 'liste_actionnaires' in variables:
        try:
            data = json.loads(variables['liste_actionnaires'])
            logger.info(f"Données actionnaires récupérées depuis liste_actionnaires: {len(data)} éléments")
            return data
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Erreur lors du parsing de liste_actionnaires: {e}")
    
    # Sinon, extraire des variables individuelles
    return extract_shareholders_from_variables(variables)

def extract_shareholders_from_variables(variables: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extrait les données des actionnaires à partir des variables individuelles.
    CORRECTION: Inclut maintenant nombre_actions_associe.
    """
    actionnaires = []
    
    # Trouver le nombre d'actionnaires
    max_index = 0
    for key in variables.keys():
        if '_associe_' in key or key.endswith('_associe'):
            # Extraire l'index de la variable
            parts = key.split('_')
            for part in parts:
                if part.isdigit():
                    max_index = max(max_index, int(part))
    
    # CORRECTION: Liste complète des champs d'actionnaires incluant nombre_actions_associe
    actionnaire_fields = [
        'nom_associe', 'date_naissance_associe', 'lieu_naissance_associe', 
        'adresse_associe', 'nationalite_associe', 'apport_numeraire_associe', 
        'nombre_parts_associe', 'nombre_actions_associe'
    ]
    
    # Si pas d'index trouvé, chercher les variables sans index
    if max_index == 0:
        actionnaire = {}
        for field in actionnaire_fields:
            if field in variables:
                actionnaire[field] = variables[field]
        
        if actionnaire:
            actionnaires.append(actionnaire)
            logger.info("Données d'actionnaire extraites sans index")
    else:
        # Extraire les actionnaires avec index
        for i in range(1, max_index + 1):
            actionnaire = {}
            
            for field in actionnaire_fields:
                key_with_index = f"{field}_{i}"
                if key_with_index in variables:
                    actionnaire[field] = variables[key_with_index]
            
            if actionnaire:
                actionnaires.append(actionnaire)
                logger.info(f"Données d'actionnaire extraites pour l'index {i}")
    
    return actionnaires

def process_individual_shareholder_variables(content: str, variables: Dict[str, Any]) -> str:
    """
    Traite les variables individuelles d'actionnaires qui ne sont pas dans des boucles.
    CORRECTION: Inclut maintenant nombre_actions_associe.
    """
    # Remplacer les variables avec index
    for key, value in variables.items():
        if ('_associe_' in key or key.endswith('_associe')) and key != 'liste_actionnaires':
            placeholder = f"{{{{{key}}}}}"
            content = content.replace(placeholder, str(value))
    
    return content

def add_loop_markers_to_template(content: str) -> str:
    """
    Ajoute automatiquement les marqueurs de boucle autour des sections répétitives détectées.
    CORRECTION: Inclut maintenant les patterns avec nombre_actions_associe.
    """
    # Détecter les patterns répétitifs d'actionnaires
    patterns_to_wrap = [
        r'({{nom_associe}}.*?{{nationalite_associe}})',
        r'(ENTRE LES SOUSSIGNES.*?{{nationalite_associe}})',
        r'({{nom_associe}}.*?porteur de.*?{{nombre_parts_associe}})',
        r'({{nom_associe}}.*?porteur de.*?{{nombre_actions_associe}})'  # AJOUT: Nouveau pattern
    ]
    
    for pattern in patterns_to_wrap:
        matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
        for match in matches:
            if '{{#LOOP_ACTIONNAIRES}}' not in match:
                wrapped_content = f"{{{{#LOOP_ACTIONNAIRES}}}}\n{match}\n{{{{/LOOP_ACTIONNAIRES}}}}"
                content = content.replace(match, wrapped_content)
    
    return content
