"use client"

import React from "react"

import { useState } from "react"
import axios from "axios"
import { FileText, Eye } from "lucide-react"
import "../template-table.css"

const ControleTemplateV5 = ({ templates, fetchTemplates, setSuccessMsg, setErrorMsg }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateVariables, setTemplateVariables] = useState([])
  const [comments, setComments] = useState("")
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0)
  const [documentContent, setDocumentContent] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchTemplateContent = async (templateId, docIndex = 0) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour accéder au contenu du template"])
        setIsLoading(false)
        return
      }
      const response = await axios.get(`http://localhost:8000/templates/${templateId}/content`, {
        params: { document_index: docIndex },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Mettre à jour les variables du template
      setTemplateVariables(response.data.variables || [])
      setIsLoading(false)
      return response.data.content
    } catch (error) {
      console.error("Erreur lors de la récupération du contenu du template:", error)
      handleApiError(error)
      setIsLoading(false)
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
        const content = await fetchTemplateContent(templateId, selectedDocumentIndex)
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
    setSelectedDocumentIndex(0) // Réinitialiser à la première position

    // Récupérer le contenu du premier document du template
    const content = await fetchTemplateContent(template.id, 0)
    if (content) {
      // Mettre à jour le template sélectionné avec son contenu
      setSelectedTemplate({
        ...template,
        content: content,
      })
    }
  }

  const handleSelectDocument = async (index) => {
    setSelectedDocumentIndex(index)
    if (selectedTemplate) {
      const content = await fetchTemplateContent(selectedTemplate.id, index)
      if (content) {
        setSelectedTemplate({
          ...selectedTemplate,
          content: content,
        })
      }
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

  const getStatusLabel = (status) => {
    switch (status) {
      case "en_attente":
        return "En attente"
      case "validé":
        return "Validé"
      case "rejeté":
        return "Rejeté"
      default:
        return "Inconnu"
    }
  }

  return React.createElement(
    "div",
    { className: "v5-templates-container" },
    selectedTemplate
      ? React.createElement(
          "div",
          { className: "v5-template-detail" },
          React.createElement(
            "div",
            { className: "v5-template-detail-header" },
            React.createElement("h2", null, selectedTemplate.titre),
            React.createElement(
              "button",
              {
                className: "v5-back-btn",
                onClick: () => setSelectedTemplate(null),
              },
              "Retour à la liste",
            ),
          ),

          React.createElement(
            "div",
            { className: "v5-template-info-grid" },
            React.createElement(
              "div",
              { className: "v5-template-info-item" },
              React.createElement("span", { className: "v5-template-info-label" }, "Type d'entreprise:"),
              React.createElement("span", { className: "v5-template-info-value" }, selectedTemplate.type_entreprise),
            ),
            React.createElement(
              "div",
              { className: "v5-template-info-item" },
              React.createElement("span", { className: "v5-template-info-label" }, "Date de création:"),
              React.createElement(
                "span",
                { className: "v5-template-info-value" },
                new Date(selectedTemplate.date_creation).toLocaleDateString("fr-FR"),
              ),
            ),
            React.createElement(
              "div",
              { className: "v5-template-info-item" },
              React.createElement("span", { className: "v5-template-info-label" }, "Statut:"),
              React.createElement(
                "span",
                {
                  className: `v5-template-status v5-${selectedTemplate.statut}`,
                },
                getStatusLabel(selectedTemplate.statut),
              ),
            ),
          ),

          React.createElement(
            "div",
            { className: "v5-template-section" },
            React.createElement("h3", null, "Description"),
            React.createElement("p", null, selectedTemplate.description || "Aucune description disponible."),
          ),

          React.createElement(
            "div",
            { className: "v5-template-section" },
            React.createElement("h3", null, "Documents du template"),
            selectedTemplate.documents && selectedTemplate.documents.length > 0
              ? React.createElement(
                  "div",
                  { className: "v5-documents-list" },
                  selectedTemplate.documents.map((doc, index) =>
                    React.createElement(
                      "div",
                      {
                        key: index,
                        className: `v5-document-item ${selectedDocumentIndex === index ? "v5-active" : ""}`,
                        onClick: () => handleSelectDocument(index),
                      },
                      React.createElement(
                        "span",
                        { className: "v5-document-title" },
                        doc.titre || `Document ${index + 1}`,
                      ),
                      React.createElement(
                        "button",
                        {
                          className: "v5-template-action-btn",
                          onClick: (e) => {
                            e.stopPropagation() // Empêcher le déclenchement du onClick parent
                            openGoogleDoc(doc.google_doc_id)
                          },
                        },
                        "Ouvrir dans Google Docs",
                      ),
                    ),
                  ),
                )
              : React.createElement("p", null, "Aucun document trouvé dans ce template."),
          ),

          React.createElement(
            "div",
            { className: "v5-template-section" },
            React.createElement("h3", null, "Contenu du document"),
            React.createElement(
              "div",
              { className: "v5-document-preview" },
              isLoading
                ? React.createElement("p", null, "Chargement du contenu...")
                : selectedTemplate.content
                  ? React.createElement(
                      "div",
                      { className: "v5-document-content" },
                      React.createElement("pre", null, selectedTemplate.content),
                    )
                  : React.createElement("p", null, "Sélectionnez un document pour voir son contenu."),
            ),
          ),

          React.createElement(
            "div",
            { className: "v5-template-section" },
            React.createElement("h3", null, "Commentaires"),
            React.createElement("textarea", {
              value: comments,
              onChange: (e) => setComments(e.target.value),
              placeholder: "Ajoutez vos commentaires ici...",
              rows: 4,
              className: "v5-comments-textarea",
            }),

            React.createElement(
              "div",
              { className: "v5-template-actions" },
              React.createElement(
                "button",
                {
                  className: "v5-validate-btn",
                  onClick: () => handleValidateTemplate(selectedTemplate.id),
                  disabled: selectedTemplate.statut !== "en_attente",
                },
                "Valider le template",
              ),
              React.createElement(
                "button",
                {
                  className: "v5-reject-btn",
                  onClick: () => handleRejectTemplate(selectedTemplate.id),
                  disabled: selectedTemplate.statut !== "en_attente",
                },
                "Rejeter le template",
              ),
            ),
          ),
        )
      : React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "v5-templates-header" },
            React.createElement(
              "h2",
              { className: "v5-templates-title" },
              React.createElement(FileText, { size: 24 }),
              "Templates à vérifier",
            ),
          ),

          templates.length === 0
            ? React.createElement(
                "div",
                { className: "v5-empty-state" },
                React.createElement("p", null, "Aucun template disponible avec le filtre sélectionné"),
              )
            : React.createElement(
                "table",
                { className: "v5-templates-table" },
                React.createElement(
                  "thead",
                  null,
                  React.createElement(
                    "tr",
                    null,
                    React.createElement("th", null, "Titre"),
                    React.createElement("th", null, "Type d'entreprise"),
                    React.createElement("th", null, "Date de création"),
                    React.createElement("th", { className: "v5-status-cell" }, "Statut"),
                    React.createElement("th", { className: "v5-actions-cell" }, "Actions"),
                  ),
                ),
                React.createElement(
                  "tbody",
                  null,
                  templates.map((template) =>
                    React.createElement(
                      "tr",
                      { key: template.id },
                      React.createElement("td", null, template.titre),
                      React.createElement("td", null, template.type_entreprise),
                      React.createElement("td", null, new Date(template.date_creation).toLocaleDateString("fr-FR")),
                      React.createElement(
                        "td",
                        { className: "v5-status-cell" },
                        React.createElement(
                          "span",
                          {
                            className: `v5-template-status v5-${template.statut}`,
                          },
                          getStatusLabel(template.statut),
                        ),
                      ),
                      React.createElement(
                        "td",
                        { className: "v5-actions-cell" },
                        React.createElement(
                          "button",
                          {
                            className: "v5-template-action-btn",
                            onClick: () => handleSelectTemplate(template),
                          },
                          React.createElement(Eye, { size: 16, className: "v5-action-icon" }),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
        ),
  )
}

export default ControleTemplateV5
