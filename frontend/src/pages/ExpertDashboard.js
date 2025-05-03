"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "./ExpertDashboard.css"

const ExpertDashboard = () => {
  // State pour les templates
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateVariables, setTemplateVariables] = useState([])
  const [comments, setComments] = useState("")

  const [entreprises, setEntreprises] = useState([])
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [activeTab, setActiveTab] = useState("templates");


  // State pour les filtres
  const [statusFilter, setStatusFilter] = useState("all")

  // State pour la sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // State pour les messages
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState([])

  // Stats
  const [stats, setStats] = useState({
    totalTemplates: 0,
    pendingTemplates: 0,
    validatedTemplates: 0,
    rejectedTemplates: 0,
  })

  // State pour le thème
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme")
    return savedTheme || "dark"
  })

  const fetchEntreprises = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:8000/entreprises/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { statut: "en_attente" }
      })
      setEntreprises(response.data)
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err)
      setErrorMsg(["Erreur lors du chargement des entreprises"])
    }
  }

  // Effect pour appliquer le thème
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setErrorMsg(["Vous devez être connecté avec un compte expert pour accéder à ce tableau de bord."])
    }
  }, [])

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    fetchEntreprises()
  }, [])

  // Update stats when templates change
  useEffect(() => {
    if (templates.length > 0) {
      const pendingCount = templates.filter((template) => template.statut === "en_attente").length
      const validatedCount = templates.filter((template) => template.statut === "validé").length
      const rejectedCount = templates.filter((template) => template.statut === "rejeté").length

      setStats({
        totalTemplates: templates.length,
        pendingTemplates: pendingCount,
        validatedTemplates: validatedCount,
        rejectedTemplates: rejectedCount,
      })
    }
  }, [templates])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("Aucun token trouvé dans localStorage")
        setErrorMsg(["Vous n'êtes pas connecté. Veuillez vous connecter avec un compte expert."])
        return
      }
  
      const response = await axios.get("http://localhost:8000/templates/expert/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      // Log pour débugger
      console.log("Données reçues de l'API:", response.data)
      
      // Normaliser les statuts si nécessaire
      const normalizedTemplates = response.data.map(template => {
        // Si le statut est manquant ou incorrect, définir à "en_attente"
        if (!template.statut || !["en_attente", "validé", "rejeté"].includes(template.statut)) {
          return { ...template, statut: "en_attente" }
        }
        return template
      })
      
      setTemplates(normalizedTemplates)
    } catch (error) {
      console.error("Erreur lors de la récupération des templates:", error)

      if (error.response) {
        if (error.response.status === 401) {
          setErrorMsg(["Accès non autorisé. Vérifiez que vous êtes connecté avec un compte expert."])
        } else {
          handleApiError(error)
        }
      } else {
        handleApiError(error)
      }
    }
  }

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
      //setSelectedTemplate(null)
      if (selectedTemplate && selectedTemplate.id === templateId) {
      await refreshSelectedTemplate(templateId)}
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
      //setSelectedTemplate(null)
      if (selectedTemplate && selectedTemplate.id === templateId) {
        await refreshSelectedTemplate(templateId)
      }
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  // Ajoutez cette fonction dans ExpertDashboard.js
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
    const updatedTemplate = templates.data.find(t => t.id === templateId)
    
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Ajoutez un état pour stocker l'heure actuelle
const [currentTime, setCurrentTime] = useState(new Date());

// Ajoutez cet effet pour mettre à jour l'heure toutes les secondes
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  
  // Nettoyage du timer lors du démontage du composant
  return () => clearInterval(timer);
}, []);

// Modifiez les fonctions formatDate et formatTime pour utiliser l'état currentTime au lieu de new Date()
const formatDate = () => {
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  return currentTime.toLocaleDateString("fr-FR", options);
};

const formatTime = () => {
  return currentTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

  const getFilteredTemplates = () => {
    if (statusFilter === "all") {
      return templates
    }
    return templates.filter((template) => template.statut === statusFilter)
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


  const handleValidateEntreprise = async (entrepriseId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/entreprises/${entrepriseId}/validate`,
        { commentaires: comments },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setSuccessMsg("Entreprise validée avec succès !")
      setComments("")
      await fetchEntreprises()
      setSelectedEntreprise(null)
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
      setErrorMsg(["Erreur lors de la validation de l'entreprise"])
    }
  }
  
  const handleRejectEntreprise = async (entrepriseId) => {
    if (!comments) {
      setErrorMsg(["Veuillez ajouter un commentaire expliquant le rejet"])
      return
    }
  
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/entreprises/${entrepriseId}/reject`,
        { commentaires: comments },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setSuccessMsg("Entreprise rejetée avec succès !")
      setComments("")
      await fetchEntreprises()
      setSelectedEntreprise(null)
    } catch (err) {
      console.error("Erreur lors du rejet:", err)
      setErrorMsg(["Erreur lors du rejet de l'entreprise"])
    }
  }

  return (
    <div className="expert-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "" : "open"}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">M</div>
            <span className="logo-text">MiaCorp</span>
          </div>
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="#" className="nav-link active">
              <svg
                className="nav-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span className="nav-text">Dashboard</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <svg
                className="nav-icon"
                xmlns="http://www.w3.org/2000/svg"
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
              <span className="nav-text">Templates</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <svg
                className="nav-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span className="nav-text">Paramètres</span>
            </a>
          </li>
          <li className="nav-item" style={{ marginTop: "auto" }}>
            <a
              href="#"
              className="nav-link"
              onClick={() => {
                localStorage.removeItem("token")
                window.location.href = "/login"
              }}
            >
              <svg
                className="nav-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span className="nav-text">Déconnexion</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Tableau de bord expert</h1>
            <div className="datetime-display">
              <span className="date">{formatDate()}</span>
              <span className="time">{formatTime()}</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="tab-button" onClick={toggleTheme}>
              {theme === "dark" ? (
                <svg
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
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg
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
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <button className="tab-button" onClick={toggleSidebar}>
              <svg
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
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {successMsg && <div className="success-message">{successMsg}</div>}
        {errorMsg.length > 0 && (
          <div className="error-message">
            {errorMsg.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
        )}

        {/* Metrics Overview */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Templates</span>
              <svg
                className="metric-icon"
                xmlns="http://www.w3.org/2000/svg"
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
            </div>
            <div className="metric-value">{stats.totalTemplates}</div>
            <div className="metric-subtitle">Templates disponibles</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">En attente</span>
              <svg
                className="metric-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="metric-value">{stats.pendingTemplates}</div>
            <div className="metric-subtitle">Templates à vérifier</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Validés</span>
              <svg
                className="metric-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="metric-value">{stats.validatedTemplates}</div>
            <div className="metric-subtitle">Templates validés</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Rejetés</span>
              <svg
                className="metric-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="metric-value">{stats.rejectedTemplates}</div>
            <div className="metric-subtitle">Templates rejetés</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="filter-container">
          <div className="filter-group">
            <label>Filtrer par statut:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="validé">Validés</option>
              <option value="rejeté">Rejetés</option>
            </select>
          </div>
        </div>

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
                  <span className="info-value">
                    {new Date(selectedTemplate.date_creation).toLocaleDateString("fr-FR")}
                  </span>
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
              {getFilteredTemplates().length === 0 ? (
                <p>Aucun template disponible avec le filtre sélectionné</p>
              ) : (
                <div className="templates-grid">
                  {getFilteredTemplates().map((template) => (
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

        // Dans le JSX de ExpertDashboard
<div className="tabs">
  <button
    className={activeTab === "templates" ? "tab-button active" : "tab-button"}
    onClick={() => setActiveTab("templates")}
  >
    Validation des Templates
  </button>
  <button
    className={activeTab === "entreprises" ? "tab-button active" : "tab-button"}
    onClick={() => setActiveTab("entreprises")}
  >
    Validation des Entreprises
  </button>
</div>

{activeTab === "entreprises" && (
  <div className="entreprises-container">
    <h2>Entreprises en attente de validation</h2>
    
    {entreprises.length === 0 ? (
      <p>Aucune entreprise en attente de validation</p>
    ) : (
      <div className="entreprises-list">
        {entreprises.map(entreprise => (
          <div 
            key={entreprise.id} 
            className="entreprise-card"
            onClick={() => setSelectedEntreprise(entreprise)}
          >
            <h3>{entreprise.nom}</h3>
            <p>Type: {entreprise.type}</p>
            <p>Créée le: {new Date(entreprise.date_creation).toLocaleDateString("fr-FR")}</p>
            <span className="status-badge en_attente">En attente</span>
          </div>
        ))}
      </div>
    )}
    
    {selectedEntreprise && (
      <div className="entreprise-detail">
        <div className="detail-header">
          <h2>{selectedEntreprise.nom}</h2>
          <button 
            className="back-btn"
            onClick={() => setSelectedEntreprise(null)}
          >
            Retour
          </button>
        </div>
        
        <div className="detail-info">
          <p><strong>Type:</strong> {selectedEntreprise.type}</p>
          <p><strong>SIRET:</strong> {selectedEntreprise.siret || "Non fourni"}</p>
          <p><strong>Capital:</strong> {selectedEntreprise.capital} €</p>
          <p><strong>Adresse:</strong> {selectedEntreprise.adresse || "Non fournie"}</p>
          <p><strong>Description:</strong> {selectedEntreprise.description || "Non fournie"}</p>
        </div>
        
        <div className="document-section">
          <h3>Document généré</h3>
          <button 
            className="preview-btn"
            onClick={() => openGoogleDoc(selectedEntreprise.template_id)}
          >
            Prévisualiser
          </button>
        </div>
        
        <div className="variables-section">
          <h3>Variables remplies</h3>
          <div className="variables-grid">
            {Object.entries(selectedEntreprise.valeurs_variables).map(([key, value]) => (
              <div key={key} className="variable-item">
                <strong>{key}:</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="validation-section">
          <h3>Validation</h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ajoutez vos commentaires ici..."
            rows={4}
          />
          
          <div className="validation-actions">
            <button 
              className="validate-btn"
              onClick={() => handleValidateEntreprise(selectedEntreprise.id)}
            >
              Valider
            </button>
            <button 
              className="reject-btn"
              onClick={() => handleRejectEntreprise(selectedEntreprise.id)}
              disabled={!comments}
            >
              Rejeter
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}


      </div>
    </div>
  )
}

export default ExpertDashboard
