"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, FileText, Building2, User, LogOut } from "lucide-react"
import "../sidebar.css"

const SidebarV5 = ({ sidebarOpen, activeTab, setActiveTab }) => {
  // État pour stocker l'heure actuelle
  const [currentTime, setCurrentTime] = useState(new Date())

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Nettoyage du timer lors du démontage du composant
    return () => clearInterval(timer)
  }, [])

  // Formater la date
  const formatDate = () => {
    const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    return currentTime.toLocaleDateString("fr-FR", options)
  }

  // Formater l'heure
  const formatTime = () => {
    return currentTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className={`v5-expert-sidebar ${sidebarOpen ? "v5-open" : "v5-closed"}`}>
      <div className="v5-sidebar-header">
        <div className="v5-logo">
          <span className="v5-logo-text">MiaCorp</span>
        </div>

        <div className="v5-sidebar-clock">
          <div className="v5-date">{formatDate()}</div>
          <div className="v5-time">{formatTime()}</div>
        </div>
      </div>

      <nav className="v5-sidebar-nav">
        <ul className="v5-nav-list">
          <li className="v5-nav-item">
            <a
              href="#"
              className={`v5-nav-link ${activeTab === "dashboard" ? "v5-active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
          </li>
          <li className="v5-nav-item">
            <a
              href="#"
              className={`v5-nav-link ${activeTab === "templates" ? "v5-active" : ""}`}
              onClick={() => setActiveTab("templates")}
            >
              <FileText size={20} />
              <span>Templates</span>
            </a>
          </li>
          <li className="v5-nav-item">
            <a
              href="#"
              className={`v5-nav-link ${activeTab === "entreprises" ? "v5-active" : ""}`}
              onClick={() => setActiveTab("entreprises")}
            >
              <Building2 size={20} />
              <span>Entreprises</span>
            </a>
          </li>
          <li className="v5-nav-item">
            <a
              href="#"
              className={`v5-nav-link ${activeTab === "profile" ? "v5-active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={20} />
              <span>Mon Profil</span>
            </a>
          </li>
        </ul>
      </nav>

      <div className="v5-sidebar-footer">
        <a
          href="#"
          className="v5-logout-link"
          onClick={() => {
            localStorage.removeItem("token")
            window.location.href = "/login"
          }}
        >
          <LogOut size={16} />
          <span className="v5-logout-text">Déconnexion</span>
        </a>
      </div>
    </div>
  )
}

export default SidebarV5
