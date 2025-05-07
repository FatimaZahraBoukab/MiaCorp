// Ce fichier contient les fonctions pour appeler l'API d'exportation de documents

/**
 * Génère et télécharge un document au format spécifié
 * @param {string} entrepriseId - ID de l'entreprise
 * @param {string} format - Format du document (pdf ou docx)
 * @returns {Promise<Blob>} - Blob contenant le document
 */
export const downloadDocument = async (entrepriseId, format = "pdf") => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Vous devez être connecté pour télécharger un document")
      }
  
      // Appel à l'API pour générer le document
      const response = await fetch(`http://localhost:8000/documents/export/${entrepriseId}?format=${format}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Erreur lors du téléchargement du document")
      }
  
      // Récupérer le blob du document
      const blob = await response.blob()
  
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob)
  
      // Créer un lien temporaire pour télécharger le fichier
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
  
      // Déterminer le nom du fichier en fonction du format
      const extension = format === "pdf" ? "pdf" : "docx"
      a.download = `document_entreprise.${extension}`
  
      // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
  
      return blob
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      throw error
    }
  }
  