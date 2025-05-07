"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import MetricsOverview from "./components/MetricsOverview"
import ControleTemplate from "./components/ControleTemplate"
import ControleEntreprise from "./components/ControleEntreprise"
import Settings from "./components/Settings"
import "./expertDashboard.css"

const ExpertDashboard = () => {
  // State pour les templates
  const [templates, setTemplates] = useState([])
  const [stats, setStats] = useState({
    totalTemplates: 0,
    pendingTemplates: 0,
    validatedTemplates: 0,
    rejectedTemplates: 0,
  })

  // State pour les entreprises
  const [entreprises, setEntreprises] = useState([])

  // State pour les filtres
  const [statusFilter, setStatusFilter] = useState("all")

  // State pour la sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // State pour les messages
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState([])

  // State pour les onglets
  const [activeTab, setActiveTab] = useState("templates")

  // State pour le thème
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme")
    return savedTheme || "dark"
  })

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
      const normalizedTemplates = response.data.map((template) => {
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

  const fetchEntreprises = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:8000/entreprises/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { statut: "en_attente" },
      })
      setEntreprises(response.data)
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err)
      setErrorMsg(["Erreur lors du chargement des entreprises"])
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const getFilteredTemplates = () => {
    if (statusFilter === "all") {
      return templates
    }
    return templates.filter((template) => template.statut === statusFilter)
  }

  return (
    <div className="expert-dashboard">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Main Content */}
      <div className="main-content">
        <Header toggleTheme={toggleTheme} toggleSidebar={toggleSidebar} theme={theme} />

        {successMsg && <div className="success-message">{successMsg}</div>}
        {errorMsg.length > 0 && (
          <div className="error-message">
            {errorMsg.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
        )}

        {/* Metrics Overview */}
        <MetricsOverview stats={stats} />

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

        {/* Tabs */}
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
          <button
            className={activeTab === "settings" ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab("settings")}
          >
            Paramètres
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "templates" && (
          <ControleTemplate
            templates={getFilteredTemplates()}
            fetchTemplates={fetchTemplates}
            setSuccessMsg={setSuccessMsg}
            setErrorMsg={setErrorMsg}
          />
        )}

        {activeTab === "entreprises" && (
          <ControleEntreprise
            entreprises={entreprises}
            fetchEntreprises={fetchEntreprises}
            setSuccessMsg={setSuccessMsg}
            setErrorMsg={setErrorMsg}
          />
        )}

        {activeTab === "settings" && <Settings theme={theme} toggleTheme={toggleTheme} />}
      </div>
    </div>
  )
}

export default ExpertDashboard
