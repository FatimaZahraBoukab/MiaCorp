"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const UsersManager = ({ setSuccessMsg, setErrorMsg, updateStats }) => {
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

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

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

      // Fetch templates to update stats
      const templatesResponse = await axios.get("http://localhost:8000/templates/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      updateStats(templatesResponse.data, response.data)
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error)
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

      await axios.delete(`http://localhost:8000/users/${userId}`, {
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

  // Modifier le rendu des badges de rôle pour utiliser les bonnes classes
  const renderRoleBadge = (role) => {
    let badgeClass = "role-badge"
    if (role === "admin") badgeClass += " admin"
    else if (role === "expert") badgeClass += " expert"
    else if (role === "client") badgeClass += " client"

    return <span className={badgeClass}>{role}</span>
  }

  return (
    <div className="section-container fade-in">
      <div className="users-container">
        {/* Users List */}
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

        {/* User Form */}
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
  )
}

export default UsersManager
