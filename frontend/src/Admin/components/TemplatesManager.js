"use client"

import { useState, useEffect } from "react"
import axios from "axios"

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
      await axios.post(
        "http://localhost:8000/templates/",
        {
          titre,
          description,
          type_entreprise: typeEntreprise,
          google_doc_id: googleDocId,
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
      setGoogleDocId("")
      setStatut("en_attente")
      // Refresh templates
      fetchTemplates()
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
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
      await axios.put(
        `http://localhost:8000/templates/${editingTemplate.id}`,
        {
          titre: editingTemplate.titre,
          description: editingTemplate.description,
          type_entreprise: editingTemplate.type_entreprise,
          google_doc_id: editingTemplate.google_doc_id,
          statut: editingTemplate.statut,
          refresh_variables: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      setSuccessMsg("Template modifié avec succès !")
      setEditingTemplate(null)
      // Refresh templates
      fetchTemplates()
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
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

  return (
    <div className="section-container fade-in">
      <div className="templates-container">
        {/* Templates List */}
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
            Templates existants
          </h2>
          {templates.length === 0 ? (
            <p>Aucun template disponible</p>
          ) : (
            <div className="templates-grid">
              {templates.map((template) => (
                <div className={`template-card ${template.statut || "en_attente"}`} key={template.id}>
                  <h3>{template.titre}</h3>
                  <p>{template.description || "Aucune description"}</p>
                  <p>Type: {template.type_entreprise}</p>
                  <p>
                    Statut:
                    <span className={`status-badge ${template.statut || "en_attente"}`}>
                      {template.statut === "validé" ? "Validé" : template.statut === "rejeté" ? "Rejeté" : "En attente"}
                    </span>
                  </p>
                  <div className="template-actions">
                    <button className="edit-btn" onClick={() => setEditingTemplate(template)}>
                      Modifier
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteTemplate(template.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Form */}
        <div className="template-form">
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
              {editingTemplate ? (
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              ) : (
                <line x1="12" y1="5" x2="12" y2="19"></line>
              )}
              {editingTemplate ? (
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              ) : (
                <line x1="5" y1="12" x2="19" y2="12"></line>
              )}
            </svg>
            {editingTemplate ? "Modifier le template" : "Créer un nouveau template"}
          </h2>
          <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
            <div className="form-group1">
              <label>Titre</label>
              <input
                type="text"
                name="titre"
                value={editingTemplate ? editingTemplate.titre : titre}
                onChange={editingTemplate ? handleEditTemplateChange : (e) => setTitre(e.target.value)}
                required
              />
            </div>
            <div className="form-group1">
              <label>Description</label>
              <textarea
                name="description"
                value={editingTemplate ? editingTemplate.description || "" : description}
                onChange={editingTemplate ? handleEditTemplateChange : (e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group1">
              <label>Type d'entreprise</label>
              <select
                name="type_entreprise"
                value={editingTemplate ? editingTemplate.type_entreprise : typeEntreprise}
                onChange={editingTemplate ? handleEditTemplateChange : (e) => setTypeEntreprise(e.target.value)}
              >
                <option value="SAS">SAS</option>
                <option value="SARL">SARL</option>
                <option value="SASU">SASU</option>
              </select>
            </div>
            {editingTemplate && (
              <div className="form-group1">
                <label>Statut</label>
                <select
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
            <div className="form-group1">
              <label>Lien Google Doc</label>
              <input
                type="text"
                name="google_doc_id"
                value={editingTemplate ? editingTemplate.google_doc_id : googleDocId}
                onChange={editingTemplate ? handleEditTemplateChange : (e) => setGoogleDocId(e.target.value)}
                required
                placeholder="https://docs.google.com/document/d/1aBcD..."
              />
            </div>
            {editingTemplate ? (
              <div className="form-actions">
                <button
                  type="button"
                  className="preview-btn"
                  onClick={() => {
                    const docId = editingTemplate.google_doc_id
                    // Utiliser la fonction extract_doc_id_from_url similaire à celle du backend
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
                  Visualiser
                </button>
                <button type="submit" className="submit-btn">
                  Mettre à jour
                </button>
                <button type="button" className="cancel-btn" onClick={() => setEditingTemplate(null)}>
                  Annuler
                </button>
              </div>
            ) : (
              <button type="submit" className="submit-btn">
                Créer
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default TemplatesManager
