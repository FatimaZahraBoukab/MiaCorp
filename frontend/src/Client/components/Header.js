"use client"

import { User, LogOut } from "lucide-react"
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

  return (
    <header className="app-header8">
      <div className="header-content8">
        <div></div> {/* Espace vide à gauche */}
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
    </header>
  )
}

export default Header
