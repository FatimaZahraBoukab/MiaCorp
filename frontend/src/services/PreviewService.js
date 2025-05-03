// services/PreviewService.js
import axios from "axios";

/**
 * Génère une prévisualisation du document en remplaçant les variables du modèle
 * @param {string} templateId - L'ID du modèle de document
 * @param {Object} variables - Les valeurs des variables à injecter dans le document
 * @returns {Promise<Object>} - Un objet contenant l'ID du document Google généré
 */
export const generatePreview = async (templateId, variables) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Utilisateur non authentifié");
    }
    
    console.log("Génération d'une prévisualisation pour le template:", templateId);
    console.log("Variables à injecter:", variables);
    
    // Préparation des données à envoyer
    const requestData = {
      valeurs_variables: variables
    };
    
    // Appel à l'API de prévisualisation
    const response = await axios.post(
      `http://localhost:8000/templates/${templateId}/preview`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log("Réponse du service de prévisualisation:", response.data);
    
    if (!response.data.google_doc_id) {
      throw new Error("Aucun ID de document Google n'a été retourné");
    }
    
    return response.data;
  } catch (error) {
    console.error("Erreur dans generatePreview:", error);
    
    // Structuration de l'erreur pour un meilleur traitement
    return {
      error: error.response?.data?.detail || error.message || "Erreur inconnue",
      success: false
    };
  }
};