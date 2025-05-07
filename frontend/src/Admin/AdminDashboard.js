"use client"

import { useState, useEffect } from "react"
import "./AdminDashboard.css"
import UsersManager from "./components/UsersManager"
import TemplatesManager from "./components/TemplatesManager"
import InboxManager from "./components/Inbox"
import SettingsManager from "./components/Settings"

const AdminDashboard = () => {
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
    pendingTemplates: 0,
    validatedTemplates: 0,
    rejectedTemplates: 0,
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

  // Assurer que tous les SVG dans la barre latérale ont la bonne couleur
  useEffect(() => {
    // S'assurer que tous les icônes SVG utilisent la couleur bleue
    const svgElements = document.querySelectorAll(".nav-icon, .metric-icon, .section-title-icon")
    svgElements.forEach((svg) => {
      svg.style.color = "var(--primary-color1)"
    })
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const updateStats = (templates, users) => {
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
  }

  // Styles inline pour forcer les changements
  const sidebarStyle = {
    width: "250px",
    minWidth: "250px",
  }

  const mainContentStyle = {
    marginLeft: sidebarOpen ? "250px" : "0px", // Ajusté pour le toggle
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "" : "closed"}`} style={sidebarStyle}>
        <div className="sidebar-header">
          <div className="logo">
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
            <a href="#" className="nav-link" onClick={() => setActiveTab("settings")}>
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
        {/* Header */}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
          }}
        >
          <div className="metric-card" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>
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
            <div className="metric-value" style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
              {stats.totalTemplates}
            </div>
            <div className="metric-subtitle" style={{ fontSize: "0.7rem" }}>
              Templates
            </div>
          </div>

          <div className="metric-card" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>
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
            <div className="metric-value" style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
              {stats.totalUsers}
            </div>
            <div className="metric-subtitle" style={{ fontSize: "0.7rem" }}>
              Utilisateurs
            </div>
          </div>

          <div className="metric-card" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>
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
            <div className="metric-value" style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
              {stats.activeUsers}
            </div>
            <div className="metric-subtitle" style={{ fontSize: "0.7rem" }}>
              Avec accès
            </div>
          </div>

          <div className="metric-card" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>
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
            <div className="metric-value" style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
              {stats.inactiveUsers}
            </div>
            <div className="metric-subtitle" style={{ fontSize: "0.7rem" }}>
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
          <button
            className={activeTab === "inbox" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("inbox")}
          >
            Boîte de réception
          </button>
          <button
            className={activeTab === "settings" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("settings")}
          >
            Paramètres
          </button>
        </div>

        {/* Active Tab Content */}
        {activeTab === "templates" && (
          <TemplatesManager setSuccessMsg={setSuccessMsg} setErrorMsg={setErrorMsg} updateStats={updateStats} />
        )}

        {activeTab === "users" && (
          <UsersManager setSuccessMsg={setSuccessMsg} setErrorMsg={setErrorMsg} updateStats={updateStats} />
        )}

        {activeTab === "inbox" && <InboxManager />}

        {activeTab === "settings" && <SettingsManager />}
      </div>
    </div>
  )
}

export default AdminDashboard
