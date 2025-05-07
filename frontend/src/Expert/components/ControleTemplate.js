"use client"

import { useState } from "react"
import axios from "axios"

const ControleTemplate = ({ templates, fetchTemplates, setSuccessMsg, setErrorMsg }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateVariables, setTemplateVariables] = useState([])
  const [comments, setComments] = useState("")

  const fetchTemplateContent = async (templateId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour accéder au contenu du template"])
        return
      }
      const response = await axios.get(`http://localhost:8000/templates/${templateId}/content`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Mettre à jour les variables du template
      setTemplateVariables(response.data.variables || [])

      return response.data.content
    } catch (error) {
      console.error("Erreur lors de la récupération du contenu du template:", error)
      handleApiError(error)
      return null
    }
  }

  const handleValidateTemplate = async (templateId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour valider un template"])
        return
      }
      await axios.put(
        `http://localhost:8000/templates/${templateId}/validate`,
        { commentaires: comments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      setSuccessMsg("Template validé avec succès !")
      setComments("")
      // Mettre à jour les templates
      await fetchTemplates()
      // Reset selected template
      if (selectedTemplate && selectedTemplate.id === templateId) {
        await refreshSelectedTemplate(templateId)
      }
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  const handleRejectTemplate = async (templateId) => {
    if (!comments) {
      setErrorMsg(["Veuillez ajouter un commentaire expliquant la raison du rejet."])
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour rejeter un template"])
        return
      }
      await axios.put(
        `http://localhost:8000/templates/${templateId}/reject`,
        { commentaires: comments },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      setSuccessMsg("Template rejeté avec succès !")
      setComments("")
      // Refresh templates
      await fetchTemplates()
      // Reset selected template
      if (selectedTemplate && selectedTemplate.id === templateId) {
        await refreshSelectedTemplate(templateId)
      }
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  const refreshSelectedTemplate = async (templateId) => {
    try {
      // Récupérer le template mis à jour
      const token = localStorage.getItem("token")
      const templates = await axios.get("http://localhost:8000/templates/expert/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Trouver le template mis à jour dans la liste
      const updatedTemplate = templates.data.find((t) => t.id === templateId)

      if (updatedTemplate) {
        // Mettre à jour le template sélectionné avec son contenu
        const content = await fetchTemplateContent(templateId)
        setSelectedTemplate({
          ...updatedTemplate,
          content: content,
        })
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du template sélectionné:", error)
    }
  }

  const handleApiError = (error) => {
    const errorData = error.response?.data

    if (error.response?.status === 401) {
      setErrorMsg(["Session expirée ou non autorisée. Veuillez vous reconnecter avec un compte expert."])
      return
    }

    if (Array.isArray(errorData?.detail)) {
      const formattedErrors = errorData.detail.map((err) => `${err.loc[1]}: ${err.msg}`)
      setErrorMsg(formattedErrors)
    } else {
      setErrorMsg([errorData?.detail || "Une erreur est survenue."])
    }
  }

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template)

    // Récupérer le contenu du template
    const content = await fetchTemplateContent(template.id)
    if (content) {
      // Mettre à jour le template sélectionné avec son contenu
      setSelectedTemplate({
        ...template,
        content: content,
      })
    }
  }

  const openGoogleDoc = (docId) => {
    // Extraire l'ID du document à partir de l'URL ou de l'ID
    const extractDocId = (url) => {
      if (url.includes("/d/")) {
        return url.split("/d/")[1].split("/")[0]
      }
      return url
    }
    const cleanDocId = extractDocId(docId)
    const url = `https://docs.google.com/document/d/${cleanDocId}/edit`
    window.open(url, "_blank")
  }

  return (
    <div className="templates-containerE">
      {selectedTemplate ? (
        <div className="template-detail">
          <div className="template-detail-header">
            <h2>{selectedTemplate.titre}</h2>
            <button className="back-btn" onClick={() => setSelectedTemplate(null)}>
              Retour à la liste
            </button>
          </div>

          <div className="template-detail-info">
            <div className="info-group">
              <span className="info-label">Type d'entreprise:</span>
              <span className="info-value">{selectedTemplate.type_entreprise}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Date de création:</span>
              <span className="info-value">{new Date(selectedTemplate.date_creation).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Statut:</span>
              <span className={`status-badge ${selectedTemplate.statut}`}>
                {selectedTemplate.statut === "en_attente"
                  ? "En attente"
                  : selectedTemplate.statut === "validé"
                    ? "Validé"
                    : "Rejeté"}
              </span>
            </div>
          </div>

          <div className="template-detail-content">
            <h3>Description</h3>
            <p>{selectedTemplate.description || "Aucune description disponible."}</p>

            <h3>Variables du template</h3>
            {templateVariables.length > 0 ? (
              <div className="variables-list">
                {templateVariables.map((variable, index) => (
                  <div key={index} className="variable-item">
                    <span className="variable-name">{`{{${variable.nom}}}`}</span>
                    <span className="variable-type">{variable.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucune variable trouvée dans ce template.</p>
            )}

            <h3>Contenu du document</h3>
            <div className="document-preview">
              <div className="preview-actions">
                <button className="preview-btn" onClick={() => openGoogleDoc(selectedTemplate.google_doc_id)}>
                  Ouvrir dans Google Docs
                </button>
              </div>
              {selectedTemplate.content ? (
                <div className="document-content">
                  <pre>{selectedTemplate.content}</pre>
                </div>
              ) : (
                <p>Chargement du contenu...</p>
              )}
            </div>

            <h3>Commentaires</h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajoutez vos commentaires ici..."
              rows={4}
              className="comments-textarea"
            ></textarea>

            <div className="template-actions">
              <button
                className="validate-btn"
                onClick={() => handleValidateTemplate(selectedTemplate.id)}
                disabled={selectedTemplate.statut !== "en_attente"}
              >
                Valider le template
              </button>
              <button
                className="reject-btn"
                onClick={() => handleRejectTemplate(selectedTemplate.id)}
                disabled={selectedTemplate.statut !== "en_attente"}
              >
                Rejeter le template
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="templates-list">
          <h2 className="section-title">
            <svg
              className="section-title-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Templates à vérifier
          </h2>
          {templates.length === 0 ? (
            <p>Aucun template disponible avec le filtre sélectionné</p>
          ) : (
            <div className="templates-grid">
              {templates.map((template) => (
                <div className={`template-card ${template.statut}`} key={template.id}>
                  <div className="template-header">
                    <h3>{template.titre}</h3>
                    <span className={`status-badge ${template.statut}`}>
                      {template.statut === "en_attente"
                        ? "En attente"
                        : template.statut === "validé"
                          ? "Validé"
                          : "Rejeté"}
                    </span>
                  </div>
                  <p>{template.description || "Aucune description"}</p>
                  <p>Type: {template.type_entreprise}</p>
                  <p>Créé le: {new Date(template.date_creation).toLocaleDateString("fr-FR")}</p>
                  <div className="template-actions">
                    <button className="view-btn" onClick={() => handleSelectTemplate(template)}>
                      Examiner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ControleTemplate
