"use client"

import { NavLink, useNavigate } from "react-router-dom"
import { Home, FileText, Edit, Briefcase, Headphones, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { useEffect, useState } from "react"

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Récupérer l'état initial depuis localStorage
    const savedState = localStorage.getItem("sidebarCollapsed") === "true"
    setCollapsed(savedState)
  }, [])

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    // Inverser l'état
    const newState = !collapsed
    // Mettre à jour l'état local
    setCollapsed(newState)
    // Sauvegarder dans localStorage
    localStorage.setItem("sidebarCollapsed", newState.toString())
    // Déclencher un événement personnalisé pour informer le layout
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: { collapsed: newState },
      }),
    )
  }

  // Fonction pour gérer la déconnexion - sans confirmation
  const handleLogout = () => {
    // 1. Supprimer le token d'authentification du localStorage
    localStorage.removeItem("authToken")
    localStorage.removeItem("userInfo")

    // 2. Supprimer les cookies de session si présents
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // 3. Rediriger vers la page de connexion
    // Utiliser navigate de react-router-dom si disponible
    navigate("/login")

    // Alternative: redirection directe
    // window.location.href = "/login"

    console.log("Déconnexion réussie")
  }

  return (
    <div className="sidebar8">
      <div className="logo-container8">
        <h2 style={{ color: "#1e3a6e" }}>
          Mia<span style={{ color: "#e05a7a" }}>Corp</span>
        </h2>
        {/* Bouton de réduction de la sidebar en haut */}
        <div className="sidebar-toggle-button-top8" onClick={toggleSidebar}>
          {collapsed ? <ChevronRight className="toggle-icon8" /> : <ChevronLeft className="toggle-icon8" />}
        </div>
      </div>

      <nav className="sidebar-nav8">
        <NavLink to="/client" end className={({ isActive }) => `nav-item8 ${isActive ? "active8" : ""}`}>
          <Home className="nav-icon8" />
          <span>Accueil</span>
        </NavLink>

        <NavLink to="/client/creation" className={({ isActive }) => `nav-item8 ${isActive ? "active8" : ""}`}>
          <FileText className="nav-icon8" />
          <span>Création d'entreprise</span>
        </NavLink>

        <NavLink to="/client/modification" className={({ isActive }) => `nav-item8 ${isActive ? "active8" : ""}`}>
          <Edit className="nav-icon8" />
          <span>Modification d'entreprise</span>
        </NavLink>

        <NavLink to="/client/demarches" className={({ isActive }) => `nav-item8 ${isActive ? "active8" : ""}`}>
          <Briefcase className="nav-icon8" />
          <span>Mes démarches</span>
        </NavLink>

        <NavLink to="/client/support" className={({ isActive }) => `nav-item8 ${isActive ? "active8" : ""}`}>
          <Headphones className="nav-icon8" />
          <span>Support</span>
        </NavLink>
      </nav>

      {/* Bouton de déconnexion en bas */}
      <div className="sidebar-footer8">
        <button className="logout-button8" onClick={handleLogout}>
          <LogOut className="nav-icon8" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
