"use client"

import { useState, useEffect } from "react"
import "./AdminDashboard.css"
import UsersManager from "./components/UsersManager"
import TemplatesManager from "./components/TemplatesManager"
import InboxManager from "./components/Inbox"
import AdminProfile from "./components/AdminProfile"
import Dashboard from "./components/Dashboard"
import { Users, FileText, Inbox, Menu, LogOut, LayoutDashboard, User } from "lucide-react"

const AdminDashboard = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("dashboard")

  // State for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // State for messages
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState([])

  // State for admin user
  const [adminUser, setAdminUser] = useState(null)

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

  // Vérifier si l'utilisateur est connecté et récupérer ses informations
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setErrorMsg(["Vous devez être connecté avec un compte administrateur pour accéder à ce tableau de bord."])
      return
    }

    // Récupérer les informations de l'utilisateur connecté
    fetchAdminProfile()
  }, [])

  // Fonction pour récupérer le profil de l'administrateur
  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setAdminUser(userData)
      } else {
        const errorData = await response.json()
        setErrorMsg([`Erreur lors de la récupération du profil: ${errorData.detail}`])
      }
    } catch (error) {
      setErrorMsg([`Erreur de connexion au serveur: ${error.message}`])
    }
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Exposer la fonction setActiveTab pour que le Dashboard puisse l'utiliser
  window.setActiveTab = (tab) => {
    setActiveTab(tab)
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

  // Fonction pour mettre à jour le profil de l'administrateur
  const updateAdminProfile = async (updatedData) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setAdminUser(updatedUser)
        setSuccessMsg("Profil mis à jour avec succès !")

        // Effacer le message après 3 secondes
        setTimeout(() => {
          setSuccessMsg("")
        }, 3000)

        return true
      } else {
        const errorData = await response.json()
        setErrorMsg([`Erreur lors de la mise à jour du profil: ${errorData.detail}`])
        return false
      }
    } catch (error) {
      setErrorMsg([`Erreur de connexion au serveur: ${error.message}`])
      return false
    }
  }

  // Fonction pour changer le mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/users/me/password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (response.ok) {
        setSuccessMsg("Mot de passe modifié avec succès !")

        // Effacer le message après 3 secondes
        setTimeout(() => {
          setSuccessMsg("")
        }, 3000)

        return true
      } else {
        const errorData = await response.json()
        setErrorMsg([`Erreur lors de la modification du mot de passe: ${errorData.detail}`])
        return false
      }
    } catch (error) {
      setErrorMsg([`Erreur de connexion au serveur: ${error.message}`])
      return false
    }
  }

  // Fonction pour mettre à jour l'avatar
  const updateAvatar = async (avatarFile) => {
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("avatar", avatarFile)

      const response = await fetch("http://localhost:8000/users/me/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setAdminUser(updatedUser)
        setSuccessMsg("Avatar mis à jour avec succès !")

        // Effacer le message après 3 secondes
        setTimeout(() => {
          setSuccessMsg("")
        }, 3000)

        return true
      } else {
        const errorData = await response.json()
        setErrorMsg([`Erreur lors de la mise à jour de l'avatar: ${errorData.detail}`])
        return false
      }
    } catch (error) {
      setErrorMsg([`Erreur de connexion au serveur: ${error.message}`])
      return false
    }
  }

  // Obtenir les initiales de l'utilisateur pour l'avatar
  const getUserInitials = () => {
    if (adminUser) {
      return `${adminUser.prenom?.[0] || ""}${adminUser.nom?.[0] || ""}`.toUpperCase()
    }
    return "A"
  }

  return (
    <div className="v0-admin-dashboard">
      {/* Sidebar */}
      <aside className={`v0-sidebar ${sidebarOpen ? "v0-open" : "v0-closed"}`}>
        <div className="v0-sidebar-header">
          <div className="v0-logo">
            <span className="v0-logo-text">MiaCorp</span>
          </div>

          <div className="v0-sidebar-clock">
            <div className="v0-date">{formatDate()}</div>
            <div className="v0-time">{formatTime()}</div>
          </div>
        </div>

        <nav className="v0-sidebar-nav">
          <ul className="v0-nav-list">
            <li className="v0-nav-item">
              <a
                href="#"
                className={`v0-nav-link ${activeTab === "dashboard" ? "v0-active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </a>
            </li>
            <li className="v0-nav-item">
              <a
                href="#"
                className={`v0-nav-link ${activeTab === "templates" ? "v0-active" : ""}`}
                onClick={() => setActiveTab("templates")}
              >
                <FileText size={20} />
                <span>Templates</span>
              </a>
            </li>
            <li className="v0-nav-item">
              <a
                href="#"
                className={`v0-nav-link ${activeTab === "users" ? "v0-active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <Users size={20} />
                <span>Utilisateurs</span>
              </a>
            </li>
            <li className="v0-nav-item">
              <a
                href="#"
                className={`v0-nav-link ${activeTab === "inbox" ? "v0-active" : ""}`}
                onClick={() => setActiveTab("inbox")}
              >
                <Inbox size={20} />
                <span>Boîte de réception</span>
              </a>
            </li>
            <li className="v0-nav-item">
              <a
                href="#"
                className={`v0-nav-link ${activeTab === "profile" ? "v0-active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User size={20} />
                <span>Mon Profil</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="v0-sidebar-footer">
          <div className="v0-user-profile">
            <div className="v0-user-info">
              <a
                href="#"
                className="v0-logout-link"
                onClick={() => {
                  localStorage.removeItem("token")
                  window.location.href = "/login"
                }}
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="v0-main-content">
        {/* Header */}
        <header className="v0-header">
          <div className="v0-header-left">
            <button className="v0-menu-toggle" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
          </div>

          <div className="v0-header-right">
            <div className="v0-user-profile">
              <div
                className="v0-avatar v0-avatar-clickable"
                onClick={() => setActiveTab("profile")}
                title="Voir mon profil"
              >
                {adminUser && adminUser.avatar ? (
                  <img src={adminUser.avatar || "/placeholder.svg"} alt="Avatar" className="v0-avatar-image" />
                ) : (
                  <span>{getUserInitials()}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Toggle */}
        <div className="v0-mobile-menu-container">
          <button className="v0-mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span>Menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={mobileMenuOpen ? "v0-rotate" : ""}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {mobileMenuOpen && (
            <div className="v0-mobile-menu">
              <a
                href="#"
                className={activeTab === "dashboard" ? "v0-active" : ""}
                onClick={() => {
                  setActiveTab("dashboard")
                  setMobileMenuOpen(false)
                }}
              >
                Dashboard
              </a>
              <a
                href="#"
                className={activeTab === "templates" ? "v0-active" : ""}
                onClick={() => {
                  setActiveTab("templates")
                  setMobileMenuOpen(false)
                }}
              >
                Templates
              </a>
              <a
                href="#"
                className={activeTab === "users" ? "v0-active" : ""}
                onClick={() => {
                  setActiveTab("users")
                  setMobileMenuOpen(false)
                }}
              >
                Utilisateurs
              </a>
              <a
                href="#"
                className={activeTab === "inbox" ? "v0-active" : ""}
                onClick={() => {
                  setActiveTab("inbox")
                  setMobileMenuOpen(false)
                }}
              >
                Boîte de réception
              </a>
              <a
                href="#"
                className={activeTab === "profile" ? "v0-active" : ""}
                onClick={() => {
                  setActiveTab("profile")
                  setMobileMenuOpen(false)
                }}
              >
                Mon Profil
              </a>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="v0-notifications-container">
          {successMsg && <div className="v0-notification v0-success">{successMsg}</div>}
          {errorMsg.length > 0 && (
            <div className="v0-notification v0-error">
              {errorMsg.map((msg, index) => (
                <p key={index}>{msg}</p>
              ))}
            </div>
          )}
        </div>

        {/* Afficher les statistiques sur toutes les pages sauf le profil et le dashboard */}
        {activeTab !== "profile" && activeTab !== "dashboard" && (
          <div className="v0-stats-grid">
            <div className="v0-stat-card">
              <div className="v0-stat-icon">
                <FileText size={24} />
              </div>
              <div className="v0-stat-content">
                <span className="v0-stat-value">{stats.totalTemplates}</span>
                <span className="v0-stat-label">Templates</span>
              </div>
            </div>

            <div className="v0-stat-card">
              <div className="v0-stat-icon">
                <Users size={24} />
              </div>
              <div className="v0-stat-content">
                <span className="v0-stat-value">{stats.totalUsers}</span>
                <span className="v0-stat-label">Utilisateurs</span>
              </div>
            </div>

            <div className="v0-stat-card">
              <div className="v0-stat-icon v0-active">
                <Users size={24} />
              </div>
              <div className="v0-stat-content">
                <span className="v0-stat-value">{stats.activeUsers}</span>
                <span className="v0-stat-label">Utilisateurs actifs</span>
              </div>
            </div>

            <div className="v0-stat-card">
              <div className="v0-stat-icon v0-inactive">
                <Users size={24} />
              </div>
              <div className="v0-stat-content">
                <span className="v0-stat-value">{stats.inactiveUsers}</span>
                <span className="v0-stat-label">Utilisateurs inactifs</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="v0-tab-content">
          {activeTab === "dashboard" && <Dashboard stats={stats} />}

          {activeTab === "templates" && (
            <TemplatesManager setSuccessMsg={setSuccessMsg} setErrorMsg={setErrorMsg} updateStats={updateStats} />
          )}

          {activeTab === "users" && (
            <UsersManager setSuccessMsg={setSuccessMsg} setErrorMsg={setErrorMsg} updateStats={updateStats} />
          )}

          {activeTab === "inbox" && <InboxManager />}

          {activeTab === "profile" && (
            <AdminProfile
              admin={adminUser}
              updateProfile={updateAdminProfile}
              changePassword={changePassword}
              updateAvatar={updateAvatar}
              setSuccessMsg={setSuccessMsg}
              setErrorMsg={setErrorMsg}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
