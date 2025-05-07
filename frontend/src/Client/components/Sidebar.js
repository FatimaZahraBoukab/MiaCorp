"use client"

import { NavLink } from "react-router-dom"
import { Home, FileText, Edit, Briefcase, Headphones } from "lucide-react"

const Sidebar = () => {
  return (
    <div className="sidebar8">
      <div className="logo-container8">
        <h2 style={{ color: "#1e3a6e" }}>
          Mia<span style={{ color: "#e05a7a" }}>Corp</span>
        </h2>
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
    </div>
  )
}

export default Sidebar
