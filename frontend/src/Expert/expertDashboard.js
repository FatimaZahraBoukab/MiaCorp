"use client"

import React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import SidebarV5 from "./components/Sidebar"
import HeaderV5 from "./components/Header"
import Dashboard from "./components/Dashboard"
import ControleTemplateV5 from "./components/ControleTemplate"
import ControleEntrepriseV5 from "./components/ControleEntreprise"
import ProfileV5 from "./components/ProfileExpert"
import MetricsOverviewV5 from "./components/MetricsOverview"
import "./expertDashboard.css"
import "./sidebar.css"
import "./dashboard-welcome.css"
import "./template-table.css"
import "./entreprise-table.css"

const ExpertDashboardV5 = () => {
  // State pour les templates
  const [templates, setTemplates] = useState([])
  const [stats, setStats] = useState({
    totalTemplates: 0,
    pendingTemplates: 0,
    validatedTemplates: 0,
    rejectedTemplates: 0,
    templates: [], // Ajout des templates pour le dashboard
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
  const [activeTab, setActiveTab] = useState("dashboard")

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setErrorMsg(["Vous devez être connecté avec un compte expert pour accéder à ce tableau de bord."])
    }
  }, [])

  // Ajouter un écouteur d'événement pour changer d'onglet depuis le dashboard
  useEffect(() => {
    const handleChangeTab = (event) => {
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab)
      }
    }

    window.addEventListener("changeTab", handleChangeTab)

    return () => {
      window.removeEventListener("changeTab", handleChangeTab)
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

      setStats((prevStats) => ({
        ...prevStats,
        totalTemplates: templates.length,
        pendingTemplates: pendingCount,
        validatedTemplates: validatedCount,
        rejectedTemplates: rejectedCount,
        templates: templates, // Ajout des templates pour le dashboard
      }))
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

  // Afficher les statistiques sur toutes les pages sauf le profil
  const shouldShowMetrics = false // Désactiver les métriques en haut de chaque page

  return React.createElement(
    "div",
    { className: "v5-expert-dashboard" },
    // Sidebar
    React.createElement(SidebarV5, {
      sidebarOpen: sidebarOpen,
      activeTab: activeTab,
      setActiveTab: setActiveTab,
    }),

    // Main Content
    React.createElement(
      "div",
      { className: "v5-main-content" },
      React.createElement(HeaderV5, {
        toggleSidebar: toggleSidebar,
        setActiveTab: setActiveTab,
      }),

      successMsg && React.createElement("div", { className: "v5-success-message" }, successMsg),

      errorMsg.length > 0 &&
        React.createElement(
          "div",
          { className: "v5-error-message" },
          errorMsg.map((msg, index) => React.createElement("p", { key: index }, msg)),
        ),

      // Afficher les statistiques sur toutes les pages sauf le profil
      shouldShowMetrics && React.createElement(MetricsOverviewV5, { stats: stats }),

      // Content based on active tab
      activeTab === "dashboard" && React.createElement(Dashboard, { stats: stats }),

      activeTab === "templates" &&
        React.createElement(
          React.Fragment,
          null,
          // Filtres
          React.createElement(
            "div",
            { className: "v5-filter-container" },
            React.createElement(
              "div",
              { className: "v5-filter-group" },
              React.createElement("label", null, "Filtrer par statut:"),
              React.createElement(
                "select",
                {
                  value: statusFilter,
                  onChange: (e) => setStatusFilter(e.target.value),
                },
                React.createElement("option", { value: "all" }, "Tous"),
                React.createElement("option", { value: "en_attente" }, "En attente"),
                React.createElement("option", { value: "validé" }, "Validés"),
                React.createElement("option", { value: "rejeté" }, "Rejetés"),
              ),
            ),
          ),

          React.createElement(ControleTemplateV5, {
            templates: getFilteredTemplates(),
            fetchTemplates: fetchTemplates,
            setSuccessMsg: setSuccessMsg,
            setErrorMsg: setErrorMsg,
          }),
        ),

      activeTab === "entreprises" &&
        React.createElement(ControleEntrepriseV5, {
          entreprises: entreprises,
          fetchEntreprises: fetchEntreprises,
          setSuccessMsg: setSuccessMsg,
          setErrorMsg: setErrorMsg,
        }),

      activeTab === "profile" && React.createElement(ProfileV5),
    ),
  )
}

export default ExpertDashboardV5
