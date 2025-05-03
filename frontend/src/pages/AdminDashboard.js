"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "./AdminDashboard.css"

const AdminDashboard = () => {
  // State for template creation
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [typeEntreprise, setTypeEntreprise] = useState("SAS")
  const [googleDocId, setGoogleDocId] = useState("")
  const [statut, setStatut] = useState("en_attente") // Ajout du statut

  // State for template management
  const [templates, setTemplates] = useState([])
  const [editingTemplate, setEditingTemplate] = useState(null)

  // State for user management
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    role: "client",
  })

  // State for active tab
  const [activeTab, setActiveTab] = useState("templates")

  // State for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // State for messages
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState([])

  // Stats
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingTemplates: 0, // Ajout pour les templates en attente
    validatedTemplates: 0, // Ajout pour les templates validés
    rejectedTemplates: 0, // Ajout pour les templates rejetés
  })

  // State for theme
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme")
    return savedTheme || "dark"
  })

  // Effect to apply theme
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
      setErrorMsg(["Vous devez être connecté avec un compte administrateur pour accéder à ce tableau de bord."])
    }
  }, [])

  // Fetch templates and users on component mount
  useEffect(() => {
    fetchTemplates()
    fetchUsers()
  }, [])

  // Update stats when templates or users change
  useEffect(() => {
    const activeUsers = users.filter((user) => user.est_actif).length
    const pendingTemplates = templates.filter((template) => template.statut === "en_attente").length
    const validatedTemplates = templates.filter((template) => template.statut === "validé").length
    const rejectedTemplates = templates.filter((template) => template.statut === "rejeté").length

    setStats({
      totalTemplates: templates.length,
      totalUsers: users.length,
      activeUsers: activeUsers,
      inactiveUsers: users.length - activeUsers,
      pendingTemplates: pendingTemplates,
      validatedTemplates: validatedTemplates,
      rejectedTemplates: rejectedTemplates,
    })
  }, [templates, users])

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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour accéder aux utilisateurs"])
        return
      }
      const response = await axios.get("http://localhost:8000/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUsers(response.data)
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error)
      handleApiError(error)
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
          statut: statut, // Ajout du statut
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
      setStatut("en_attente") // Reset statut
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
          statut: editingTemplate.statut, // Ajout du statut
          refresh_variables: true, // Nouveau paramètre
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

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg([])

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour créer un utilisateur"])
        return
      }

      let endpoint = "http://localhost:8000/users/clients/"
      if (newUser.role === "expert") {
        endpoint = "http://localhost:8000/users/experts/"
        // Add required field for expert
        newUser.numero_professionnel = newUser.numero_professionnel || "N/A"
      }

      await axios.post(endpoint, newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSuccessMsg("Utilisateur créé avec succès !")
      // Reset form
      setNewUser({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        mot_de_passe: "",
        role: "client",
      })
      // Refresh users
      fetchUsers()
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  const handleUpdateUser = async (userId, isActive) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour modifier un utilisateur"])
        return
      }
      await axios.put(
        `http://localhost:8000/users/${userId}`,
        {
          est_actif: isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      setSuccessMsg(`Utilisateur ${isActive ? "activé" : "désactivé"} avec succès !`)
      // Refresh users
      fetchUsers()
    } catch (error) {
      console.error(error)
      handleApiError(error)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMsg(["Vous devez être connecté pour supprimer un utilisateur"])
        return
      }

      const response = await axios.delete(`http://localhost:8000/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSuccessMsg("Utilisateur supprimé avec succès !")
      // Refresh users
      fetchUsers()
    } catch (error) {
      console.error("Erreur complète:", error)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewUser({
      ...newUser,
      [name]: value,
    })
  }

  const handleEditTemplateChange = (e) => {
    const { name, value } = e.target
    setEditingTemplate({
      ...editingTemplate,
      [name]: value,
    })
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Ajoutez un état pour stocker l'heure actuelle
  const [currentTime, setCurrentTime] = useState(new Date())

  // Ajoutez cet effet pour mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Nettoyage du timer lors du démontage du composant
    return () => clearInterval(timer)
  }, [])

  // Modifiez les fonctions formatDate et formatTime pour utiliser l'état currentTime au lieu de new Date()
  const formatDate = () => {
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    return currentTime.toLocaleDateString("fr-FR", options)
  }

  const formatTime = () => {
    return currentTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (activeTab === "inbox") fetchMessages()
  }, [activeTab])

  const fetchMessages = async () => {
    const res = await fetch("http://localhost:8000/contact/")
    const data = await res.json()
    setMessages(data)
  }

  const markAsRead = async (id) => {
    await fetch(`http://localhost:8000/contact/${id}/lu`, { method: "PUT" })
    fetchMessages()
  }

  const deleteMessage = async (id) => {
    await fetch(`http://localhost:8000/contact/${id}`, { method: "DELETE" })
    fetchMessages()
  }

  // Styles inline pour forcer les changements
  const sidebarStyle = {
    width: "250px",
    minWidth: "250px",
  }

  const mainContentStyle = {
    marginLeft: "250px", // Même valeur que la largeur de la sidebar
  }

  const metricsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)", // Force 4 colonnes
    gap: "0.75rem", // Réduit l'espace entre les cartes
  }

  const metricCardStyle = {
    padding: "0.75rem", // Réduit le padding
    fontSize: "0.9rem", // Réduit la taille de police
  }

  const metricValueStyle = {
    fontSize: "1.5rem", // Réduit la taille de la valeur
    marginBottom: "0.25rem",
  }

  const metricSubtitleStyle = {
    fontSize: "0.7rem", // Réduit la taille du sous-titre
  }

  // Modifier les classes des badges pour utiliser les nouvelles classes CSS

  // Modifier le rendu des badges de rôle pour utiliser les bonnes classes
  const renderRoleBadge = (role) => {
    let badgeClass = "role-badge"
    if (role === "admin") badgeClass += " admin"
    else if (role === "expert") badgeClass += " expert"
    else if (role === "client") badgeClass += " client"

    return <span className={badgeClass}>{role}</span>
  }

  // Assurer que tous les SVG dans la barre latérale ont la bonne couleur
  // Ajouter cette fonction dans le composant AdminDashboard
  useEffect(() => {
    // S'assurer que tous les icônes SVG utilisent la couleur bleue
    const svgElements = document.querySelectorAll(".nav-icon, .metric-icon, .section-title-icon")
    svgElements.forEach((svg) => {
      svg.style.color = "var(--primary-color1)"
    })
  }, [])

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "" : "open"}`} style={sidebarStyle}>
        <div className="sidebar-header">
          <div className="logo">
            {/* Suppression de l'icône M */}
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
            <a href="#" className="nav-link" onClick={() => setActiveTab("templates")}>
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
            <a href="#" className="nav-link" onClick={() => setActiveTab("users")}>
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="nav-text">Utilisateurs</span>
            </a>
          </li>

          <li className="nav-item">
            <a href="#" className="nav-link" onClick={() => setActiveTab("inbox")}>
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
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span className="nav-text">Boîte de réception</span>
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
      <div className="main-content" style={mainContentStyle}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Tableau de bord administrateur</h1>
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
        <div style={metricsGridStyle}>
          <div className="metric-card" style={metricCardStyle}>
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
            <div className="metric-value" style={metricValueStyle}>
              {stats.totalTemplates}
            </div>
            <div className="metric-subtitle" style={metricSubtitleStyle}>
              Templates
            </div>
          </div>

          <div className="metric-card" style={metricCardStyle}>
            <div className="metric-header">
              <span className="metric-title">Utilisateurs</span>
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="metric-value" style={metricValueStyle}>
              {stats.totalUsers}
            </div>
            <div className="metric-subtitle" style={metricSubtitleStyle}>
              Utilisateurs
            </div>
          </div>

          <div className="metric-card" style={metricCardStyle}>
            <div className="metric-header">
              <span className="metric-title">Actifs</span>
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
            <div className="metric-value" style={metricValueStyle}>
              {stats.activeUsers}
            </div>
            <div className="metric-subtitle" style={metricSubtitleStyle}>
              Avec accès
            </div>
          </div>

          <div className="metric-card" style={metricCardStyle}>
            <div className="metric-header">
              <span className="metric-title">Inactifs</span>
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
            <div className="metric-value" style={metricValueStyle}>
              {stats.inactiveUsers}
            </div>
            <div className="metric-subtitle" style={metricSubtitleStyle}>
              Sans accès
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "templates" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("templates")}
          >
            Gestion des Templates
          </button>
          <button
            className={activeTab === "users" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("users")}
          >
            Gestion des Utilisateurs
          </button>
        </div>

        {activeTab === "templates" && (
          <div className="section-container fade-in">
            <div className="templates-container">
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
                            {template.statut === "validé"
                              ? "Validé"
                              : template.statut === "rejeté"
                                ? "Rejeté"
                                : "En attente"}
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

              {editingTemplate ? (
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
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Modifier le template
                  </h2>
                  <form onSubmit={handleUpdateTemplate}>
                    <div className="form-group1">
                      <label>Titre</label>
                      <input
                        type="text"
                        name="titre"
                        value={editingTemplate.titre}
                        onChange={handleEditTemplateChange}
                        required
                      />
                    </div>
                    <div className="form-group1">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={editingTemplate.description || ""}
                        onChange={handleEditTemplateChange}
                      />
                    </div>
                    <div className="form-group1">
                      <label>Type d'entreprise</label>
                      <select
                        name="type_entreprise"
                        value={editingTemplate.type_entreprise}
                        onChange={handleEditTemplateChange}
                      >
                        <option value="SAS">SAS</option>
                        <option value="SARL">SARL</option>
                        <option value="SASU">SASU</option>
                      </select>
                    </div>
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
                  </form>
                </div>
              ) : (
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
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Créer un nouveau template
                  </h2>
                  <form onSubmit={handleCreateTemplate}>
                    <div className="form-group1">
                      <label>Titre</label>
                      <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required />
                    </div>
                    <div className="form-group1">
                      <label>Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="form-group1">
                      <label>Type d'entreprise</label>
                      <select value={typeEntreprise} onChange={(e) => setTypeEntreprise(e.target.value)}>
                        <option value="SAS">SAS</option>
                        <option value="SARL">SARL</option>
                        <option value="SASU">SASU</option>
                      </select>
                    </div>
                    <div className="form-group1">
                      <label>Lien Google Docs</label>
                      <input
                        type="text"
                        value={googleDocId}
                        onChange={(e) => setGoogleDocId(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="submit-btn">
                      Créer
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="section-container fade-in">
            <div className="users-container">
              <div className="users-list">
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Utilisateurs
                </h2>
                {users.length === 0 ? (
                  <p>Aucun utilisateur disponible</p>
                ) : (
                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Prénom</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.nom}</td>
                            <td>{user.prenom}</td>
                            <td>{user.email}</td>
                            <td>{renderRoleBadge(user.role)}</td>
                            <td>
                              <span className={`status-badge ${user.est_actif ? "active" : "inactive"}`}>
                                {user.est_actif ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td className="action-buttons">
                              {user.est_actif ? (
                                <button className="ban-btn" onClick={() => handleUpdateUser(user.id, false)}>
                                  Bannir
                                </button>
                              ) : (
                                <button className="activate-btn" onClick={() => handleUpdateUser(user.id, true)}>
                                  Activer
                                </button>
                              )}
                              <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="user-form">
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Ajouter un utilisateur
                </h2>
                <form onSubmit={handleCreateUser}>
                  <div className="form-group1">
                    <label>Nom</label>
                    <input type="text" name="nom" value={newUser.nom} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group1">
                    <label>Prénom</label>
                    <input type="text" name="prenom" value={newUser.prenom} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group1">
                    <label>Email</label>
                    <input type="email" name="email" value={newUser.email} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group1">
                    <label>Téléphone</label>
                    <input type="tel" name="telephone" value={newUser.telephone} onChange={handleInputChange} />
                  </div>
                  <div className="form-group1">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      name="mot_de_passe"
                      value={newUser.mot_de_passe}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group1">
                    <label>Rôle</label>
                    <select name="role" value={newUser.role} onChange={handleInputChange}>
                      <option value="client">Client</option>
                      <option value="expert">Expert</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {newUser.role === "expert" && (
                    <div className="form-group1">
                      <label>Numéro professionnel</label>
                      <input
                        type="text"
                        name="numero_professionnel"
                        value={newUser.numero_professionnel || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                  <button type="submit" className="submit-btn">
                    Ajouter
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="section-container fade-in">
            <h2 className="section-title">Boîte de réception</h2>
            {messages.map((msg) => (
              <div key={msg.id} className="template-card">
                <h3>
                  {msg.firstName} {msg.lastName}
                </h3>
                <p>
                  <strong>Email:</strong> {msg.email}
                </p>
                <p>
                  <strong>Message:</strong> {msg.message}
                </p>
                <p>
                  <strong>Lu:</strong> {msg.lu ? "Oui" : "Non"}
                </p>
                <div className="template-actions">
                  {!msg.lu && (
                    <button className="edit-btn" onClick={() => markAsRead(msg.id)}>
                      Marquer comme lu
                    </button>
                  )}
                  <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
