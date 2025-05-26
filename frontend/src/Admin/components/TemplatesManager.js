"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { FileText, Edit, Trash2, Plus, Check, X, Eye, AlertCircle } from "lucide-react"
import "./TemplatesManager.css"

const TemplatesManager = ({ setSuccessMsg, setErrorMsg, updateStats }) => {
  // State for template creation
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [typeEntreprise, setTypeEntreprise] = useState("SAS")
  const [googleDocId, setGoogleDocId] = useState("")
  const [statut, setStatut] = useState("en_attente")

  // State for template management
  const [templates, setTemplates] = useState([])
  const [editingTemplate, setEditingTemplate] = useState(null)

  const [googleDocs, setGoogleDocs] = useState([{ titre: "", google_doc_id: "" }])
  const [activeView, setActiveView] = useState("list") // "list" ou "form"

  // Ajouter un état pour gérer l'affichage de la modal de commentaire de rejet :
  const [showRejectCommentModal, setShowRejectCommentModal] = useState(false)
  const [selectedRejectedTemplate, setSelectedRejectedTemplate] = useState(null)

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("Aucun token trouvé dans localStorage")
        setErrorMsg(["Vous n'êtes pas connecté. Veuillez vous connecter avec un compte administrateur."])
        return
      }

      const response = await axios.get("http://localhost:8000/templates/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setTemplates(response.data)

      // Fetch users to update stats
      const usersResponse = await axios.get("http://localhost:8000/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      updateStats(response.data, usersResponse.data)
    } catch (error) {
      console.error("Erreur lors de la récupération des templates:", error)

      if (error.response) {
        if (error.response.status === 401) {
          setErrorMsg(["Accès non autorisé. Vérifiez que vous êtes connecté avec un compte administrateur."])
        } else {
          handleApiError(error)
        }
      } else {
        handleApiError(error)
      }
    }
  }

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg([])

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour créer un template"])
        return
      }

      // Convertir les documents pour l'API
      const documents = googleDocs.map((doc) => ({
        titre: doc.titre,
        google_doc_id: doc.google_doc_id,
        google_doc_url: doc.google_doc_id, // L'URL sera traitée côté serveur
      }))

      await axios.post(
        "http://localhost:8000/templates/",
        {
          titre,
          description,
          type_entreprise: typeEntreprise,
          documents: documents,
          statut: statut,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      setSuccessMsg("Template créé avec succès !")
      // Reset form
      setTitre("")
      setDescription("")
      setTypeEntreprise("SAS")
      setGoogleDocs([{ titre: "", google_doc_id: "" }])
      setStatut("en_attente")
      // Refresh templates
      fetchTemplates()
      setActiveView("list")
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  // Ajoutez ces fonctions pour gérer l'ajout/suppression de documents
  const handleAddDocument = () => {
    setGoogleDocs([...googleDocs, { titre: "", google_doc_id: "" }])
  }

  const handleRemoveDocument = (index) => {
    const newDocs = [...googleDocs]
    newDocs.splice(index, 1)
    setGoogleDocs(newDocs)
  }

  const handleDocumentChange = (index, field, value) => {
    const newDocs = [...googleDocs]
    newDocs[index][field] = value
    setGoogleDocs(newDocs)
  }

  const handleUpdateTemplate = async (e) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg([])

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour modifier un template"])
        return
      }

      // Si nous éditons, nous devons maintenir la structure de documents
      const updatedTemplate = {
        ...editingTemplate,
        refresh_variables: true,
      }

      await axios.put(`http://localhost:8000/templates/${editingTemplate.id}`, updatedTemplate, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSuccessMsg("Template modifié avec succès !")
      setEditingTemplate(null)
      // Refresh templates
      fetchTemplates()
      setActiveView("list")
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  // Ajouter ces fonctions pour éditer les documents dans un template existant
  const handleAddDocumentToExisting = () => {
    const updatedTemplate = {
      ...editingTemplate,
      documents: [
        ...(editingTemplate.documents || []),
        {
          id: Date.now().toString(),
          titre: "",
          google_doc_id: "",
          google_doc_url: "", // Ajout du champ google_doc_url nécessaire
        },
      ],
    }
    setEditingTemplate(updatedTemplate)
  }

  const handleRemoveDocumentFromExisting = (index) => {
    const documents = [...editingTemplate.documents]
    documents.splice(index, 1)
    setEditingTemplate({
      ...editingTemplate,
      documents: documents,
    })
  }

  const handleExistingDocumentChange = (index, field, value) => {
    const documents = [...editingTemplate.documents]
    documents[index][field] = value
    setEditingTemplate({
      ...editingTemplate,
      documents: documents,
    })
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour supprimer un template"])
        return
      }
      await axios.delete(`http://localhost:8000/templates/${templateId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSuccessMsg("Template supprimé avec succès !")
      // Refresh templates
      fetchTemplates()
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  const handleApiError = (error) => {
    const errorData = error.response?.data

    if (error.response?.status === 401) {
      setErrorMsg(["Session expirée ou non autorisée. Veuillez vous reconnecter avec un compte administrateur."])
      return
    }

    if (Array.isArray(errorData?.detail)) {
      const formattedErrors = errorData.detail.map((err) => `${err.loc[1]}: ${err.msg}`)
      setErrorMsg(formattedErrors)
    } else {
      setErrorMsg([errorData?.detail || "Une erreur est survenue."])
    }
  }

  const handleEditTemplateChange = (e) => {
    const { name, value } = e.target
    setEditingTemplate({
      ...editingTemplate,
      [name]: value,
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "validé":
        return "v0-badge v0-badge-success"
      case "rejeté":
        return "v0-badge v0-badge-danger"
      default:
        return "v0-badge v0-badge-warning"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "validé":
        return "Validé"
      case "rejeté":
        return "Rejeté"
      default:
        return "En attente"
    }
  }

  const viewDocuments = (template) => {
    if (!template.documents || template.documents.length === 0) {
      alert("Ce template ne contient aucun document.")
      return
    }

    // Afficher les documents dans une boîte de dialogue ou une modale
    const docsList = template.documents.map((doc) => `- ${doc.titre}`).join("\n")
    alert(`Documents du template "${template.titre}":\n${docsList}`)
  }

  // Ajouter une fonction pour afficher le commentaire de rejet :
  const handleShowRejectComment = async (template) => {
    try {
      const token = localStorage.getItem("token")
      // Toujours récupérer les détails complets du template
      const response = await axios.get(`http://localhost:8000/templates/${template.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
  
      console.log("Template récupéré:", response.data)
      console.log("Commentaires:", response.data.commentaires)
  
      setSelectedRejectedTemplate(response.data)
      setShowRejectCommentModal(true)
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du template:", error)
      setErrorMsg(["Impossible de récupérer les détails du template"])
    }
  }

  const closeRejectCommentModal = () => {
    setShowRejectCommentModal(false)
    setSelectedRejectedTemplate(null)
  }

  return (
    <div className="v0-templates-manager">
      {/* Header with actions */}
      <div className="v0-section-header">
        <div className="v0-section-title">
          <FileText size={24} />
          <h2>Gestion des Templates</h2>
        </div>

        <div className="v0-section-actions">
          {activeView === "list" ? (
            <button className="v0-btn-new-template" onClick={() => setActiveView("form")}>
              <Plus size={16} />
              <span>Nouveau Template</span>
            </button>
          ) : (
            <button
              className="v0-btn v0-btn-outline"
              onClick={() => {
                setActiveView("list")
                setEditingTemplate(null)
              }}
            >
              <X size={16} />
              <span>Annuler</span>
            </button>
          )}
        </div>
      </div>

      {/* Template List View */}
      {activeView === "list" && (
        <div className="v0-templates-list">
          {templates.length === 0 ? (
            <div className="v0-empty-state">
              <FileText size={48} />
              <p>Aucun template disponible</p>
              <button className="v0-btn-new-template" onClick={() => setActiveView("form")}>
                <Plus size={16} />
                <span>Créer un template</span>
              </button>
            </div>
          ) : (
            <div className="v0-table-container">
              <table className="v0-table v0-templates-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Description</th>
                    <th>Type d'entreprise</th>
                    <th>Documents</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>{template.titre}</td>
                      <td className="v0-description-cell">{template.description || "Aucune description"}</td>
                      <td>{template.type_entreprise}</td>
                      <td>
                        <div className="v0-documents-count">
                          <span>{(template.documents || []).length}</span>
                          {(template.documents || []).length > 0 && (
                            <button
                              className="v0-btn v0-btn-icon"
                              onClick={() => viewDocuments(template)}
                              title="Voir les documents"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(template.statut)}>{getStatusLabel(template.statut)}</span>
                      </td>
                      <td>
                        <div className="v0-action-buttons">
                          {template.statut === "rejeté" && (
                            <button
                              className="v0-btn v0-btn-outline v0-btn-sm v0-btn-info"
                              onClick={() => handleShowRejectComment(template)}
                              title="Voir le motif de rejet"
                            >
                              <AlertCircle size={16} />
                            </button>
                          )}
                          <button
                            className="v0-btn v0-btn-outline v0-btn-sm v0-btn-edit"
                            onClick={() => {
                              setEditingTemplate(template)
                              setActiveView("form")
                            }}
                            title="Modifier"
                          >
                            <Edit size={16} className="v0-edit-icon" />
                          </button>
                          <button
                            className="v0-btn v0-btn-danger v0-btn-sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Template Form View */}
      {activeView === "form" && (
        <div className="v0-template-form v0-card">
          <div className="v0-card-header">
            <h3 className="v0-card-title">{editingTemplate ? "Modifier le template" : "Créer un nouveau template"}</h3>
          </div>
          <div className="v0-card-body">
            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
              <div className="v0-form-group">
                <label htmlFor="titre">Titre</label>
                <input
                  type="text"
                  id="titre"
                  className="v0-form-control"
                  name="titre"
                  value={editingTemplate ? editingTemplate.titre : titre}
                  onChange={editingTemplate ? handleEditTemplateChange : (e) => setTitre(e.target.value)}
                  required
                  placeholder="Entrez le titre du template"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="v0-form-control"
                  name="description"
                  value={editingTemplate ? editingTemplate.description || "" : description}
                  onChange={editingTemplate ? handleEditTemplateChange : (e) => setDescription(e.target.value)}
                  rows="3"
                  placeholder="Entrez une description (optionnel)"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="type_entreprise">Type d'entreprise</label>
                <select
                  id="type_entreprise"
                  className="v0-form-control"
                  name="type_entreprise"
                  value={editingTemplate ? editingTemplate.type_entreprise : typeEntreprise}
                  onChange={editingTemplate ? handleEditTemplateChange : (e) => setTypeEntreprise(e.target.value)}
                >
                  <option value="SAS">SAS</option>
                  <option value="SARL">SARL</option>
                  <option value="SASU">SASU</option>
                  <option value="EURL">EURL</option>
                </select>
              </div>

              {editingTemplate && (
                <div className="v0-form-group">
                  <label htmlFor="statut">Statut</label>
                  <select
                    id="statut"
                    className="v0-form-control"
                    name="statut"
                    value={editingTemplate.statut || "en_attente"}
                    onChange={handleEditTemplateChange}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="validé">Validé</option>
                    <option value="rejeté">Rejeté</option>
                  </select>
                </div>
              )}

              {/* Documents Section */}
              <div className="v0-documents-section">
                <h4 className="v0-section-subtitle">Documents Google</h4>

                {/* Pour le mode création */}
                {!editingTemplate && (
                  <>
                    {googleDocs.map((doc, index) => (
                      <div key={index} className="v0-document-entry v0-card">
                        <div className="v0-card-body">
                          <div className="v0-form-group">
                            <label>Titre du document</label>
                            <input
                              type="text"
                              className="v0-form-control"
                              value={doc.titre}
                              onChange={(e) => handleDocumentChange(index, "titre", e.target.value)}
                              required
                              placeholder="Titre du document"
                            />
                          </div>
                          <div className="v0-form-group">
                            <label>Lien Google Doc</label>
                            <input
                              type="text"
                              className="v0-form-control"
                              value={doc.google_doc_id}
                              onChange={(e) => handleDocumentChange(index, "google_doc_id", e.target.value)}
                              required
                              placeholder="https://docs.google.com/document/d/1aBcD..."
                            />
                          </div>
                          {googleDocs.length > 1 && (
                            <button
                              type="button"
                              className="v0-btn v0-btn-danger v0-btn-sm"
                              onClick={() => handleRemoveDocument(index)}
                            >
                              <Trash2 size={16} />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button type="button" className="v0-btn v0-btn-outline" onClick={handleAddDocument}>
                      <Plus size={16} />
                      <span>Ajouter un document</span>
                    </button>
                  </>
                )}

                {/* Pour le mode édition */}
                {editingTemplate && (
                  <>
                    {(editingTemplate.documents || []).map((doc, index) => (
                      <div key={doc.id || index} className="v0-document-entry v0-card">
                        <div className="v0-card-body">
                          <div className="v0-form-group">
                            <label>Titre du document</label>
                            <input
                              type="text"
                              className="v0-form-control"
                              value={doc.titre}
                              onChange={(e) => handleExistingDocumentChange(index, "titre", e.target.value)}
                              required
                              placeholder="Titre du document"
                            />
                          </div>
                          <div className="v0-form-group">
                            <label>Lien Google Doc</label>
                            <input
                              type="text"
                              className="v0-form-control"
                              value={doc.google_doc_id}
                              onChange={(e) => handleExistingDocumentChange(index, "google_doc_id", e.target.value)}
                              required
                              placeholder="https://docs.google.com/document/d/1aBcD..."
                            />
                          </div>
                          <div className="v0-document-actions">
                            <button
                              type="button"
                              className="v0-btn v0-btn-outline v0-btn-sm"
                              onClick={() => {
                                const docId = doc.google_doc_id
                                const extractDocId = (url) => {
                                  if (url.includes("/d/")) {
                                    return url.split("/d/")[1].split("/")[0]
                                  }
                                  return url
                                }
                                const cleanDocId = extractDocId(docId)
                                const url = `https://docs.google.com/document/d/${cleanDocId}/edit`
                                window.open(url, "_blank")
                              }}
                            >
                              <Eye size={16} />
                              <span>Visualiser</span>
                            </button>
                            {(editingTemplate.documents || []).length > 1 && (
                              <button
                                type="button"
                                className="v0-btn v0-btn-danger v0-btn-sm"
                                onClick={() => handleRemoveDocumentFromExisting(index)}
                              >
                                <Trash2 size={16} />
                                <span>Supprimer</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="v0-btn v0-btn-outline" onClick={handleAddDocumentToExisting}>
                      <Plus size={16} />
                      <span>Ajouter un document</span>
                    </button>
                  </>
                )}
              </div>

              <div className="v0-form-actions">
                <button type="submit" className="v0-btn-new-template">
                  <Check size={16} />
                  <span>{editingTemplate ? "Mettre à jour" : "Créer"}</span>
                </button>
                <button
                  type="button"
                  className="v0-btn v0-btn-outline"
                  onClick={() => {
                    setActiveView("list")
                    setEditingTemplate(null)
                  }}
                >
                  <X size={16} />
                  <span>Annuler</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour afficher le commentaire de rejet */}
      {showRejectCommentModal && selectedRejectedTemplate && (
        <div className="v0-modal-overlay">
          <div className="v0-reject-comment-modal">
            <div className="v0-modal-header">
              <h3>Motif de rejet</h3>
              <button className="v0-close-button" onClick={closeRejectCommentModal}>
                <X size={20} />
              </button>
            </div>

            <div className="v0-modal-content">
              <div className="v0-reject-comment-container">
                <div className="v0-reject-icon-container">
                  <AlertCircle size={48} className="v0-reject-icon" />
                </div>
                <div className="v0-reject-details">
                  <h4>Template : {selectedRejectedTemplate.titre}</h4>
                  <p className="v0-reject-date">Type d'entreprise : {selectedRejectedTemplate.type_entreprise}</p>
                  <div className="v0-comment-box">
                    <h5>Commentaire de l'expert :</h5>
                    <p>
  {selectedRejectedTemplate.commentaires && selectedRejectedTemplate.commentaires.trim() !== ""
    ? selectedRejectedTemplate.commentaires
    : "Aucun commentaire fourni."}
</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="v0-modal-footer">
              <button className="v0-btn v0-btn-outline" onClick={closeRejectCommentModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplatesManager
