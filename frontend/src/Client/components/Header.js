"use client"

import { User, LogOut, FileText, Briefcase, HelpCircle } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const handleProfileClick = () => {
    navigate("/client/profile")
    setShowDropdown(false)
  }

  const navigateTo = (path) => {
    navigate(path)
  }

  return (
    <header className="app-header8">
      <div className="header-content8">
        <div className="header-left8">
          <div className="header-quick-actions8">
            <button className="header-action-button8" onClick={() => navigateTo("/client/creation")}>
              <FileText size={18} />
              <span>Créer une entreprise</span>
            </button>
            <button className="header-action-button8" onClick={() => navigateTo("/client/demarches")}>
              <Briefcase size={18} />
              <span>Mes démarches</span>
            </button>
          </div>
        </div>

        <div className="header-right8">
          <div className="header-icons8">
            <button className="header-icon-button8" onClick={() => navigateTo("/client/support")}>
              <HelpCircle size={20} />
            </button>
          </div>

          <div className="user-actions8">
            <button className="user-button8" onClick={toggleDropdown}>
              <User />
            </button>
            {showDropdown && (
              <div className="user-dropdown8">
                <div className="dropdown-item8" onClick={handleProfileClick}>
                  <User size={20} className="dropdown-icon8" />
                  <span>Informations personnelles</span>
                </div>
                <div className="dropdown-item8" onClick={handleLogout}>
                  <LogOut size={20} className="dropdown-icon8" />
                  <span>Me déconnecter</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
