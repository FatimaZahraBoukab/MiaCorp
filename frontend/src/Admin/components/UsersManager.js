"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Users, UserPlus, Trash2, Ban, Check, X, Plus } from "lucide-react"
import "./UsersManager.css"

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
  const [activeView, setActiveView] = useState("list") // "list" ou "form"

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
      setActiveView("list")
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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "v0-badge v0-badge-primary"
      case "expert":
        return "v0-badge v0-badge-warning"
      default:
        return "v0-badge v0-badge-success"
    }
  }

  const getStatusBadgeClass = (isActive) => {
    return isActive ? "v0-badge v0-badge-success" : "v0-badge v0-badge-danger"
  }

  return (
    <div className="v0-users-manager">
      {/* Header with actions */}
      <div className="v0-section-header">
        <div className="v0-section-title">
          <Users size={24} />
          <h2>Gestion des Utilisateurs</h2>
        </div>

        <div className="v0-section-actions">
          {activeView === "list" ? (
            <button className="v0-btn-new-user" onClick={() => setActiveView("form")}>
              <UserPlus size={16} />
              <span>Nouvel Utilisateur</span>
            </button>
          ) : (
            <button className="v0-btn v0-btn-outline" onClick={() => setActiveView("list")}>
              <X size={16} />
              <span>Annuler</span>
            </button>
          )}
        </div>
      </div>

      {/* Users List View */}
      {activeView === "list" && (
        <div className="v0-users-list">
          {users.length === 0 ? (
            <div className="v0-empty-state">
              <Users size={48} />
              <p>Aucun utilisateur disponible</p>
              <button className="v0-btn-new-user" onClick={() => setActiveView("form")}>
                <UserPlus size={16} />
                <span>Créer un utilisateur</span>
              </button>
            </div>
          ) : (
            <div className="v0-table-container">
              <table className="v0-table v0-users-table">
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
                      <td>
                        <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(user.est_actif)}>
                          {user.est_actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>
                        <div className="v0-action-buttons">
                          {user.est_actif ? (
                            <button
                              className="v0-btn v0-btn-warning v0-btn-sm"
                              onClick={() => handleUpdateUser(user.id, false)}
                              title="Désactiver"
                            >
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button
                              className="v0-btn v0-btn-success v0-btn-sm"
                              onClick={() => handleUpdateUser(user.id, true)}
                              title="Activer"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            className="v0-btn v0-btn-danger v0-btn-sm"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Form View */}
      {activeView === "form" && (
        <div className="v0-user-form v0-card">
          <div className="v0-card-header">
            <h3 className="v0-card-title">Ajouter un utilisateur</h3>
          </div>
          <div className="v0-card-body">
            <form onSubmit={handleCreateUser}>
              <div className="v0-form-group">
                <label htmlFor="nom">Nom</label>
                <input
                  type="text"
                  id="nom"
                  className="v0-form-control"
                  name="nom"
                  value={newUser.nom}
                  onChange={handleInputChange}
                  required
                  placeholder="Entrez le nom"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="prenom">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  className="v0-form-control"
                  name="prenom"
                  value={newUser.prenom}
                  onChange={handleInputChange}
                  required
                  placeholder="Entrez le prénom"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="v0-form-control"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                  placeholder="exemple@email.com"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  type="tel"
                  id="telephone"
                  className="v0-form-control"
                  name="telephone"
                  value={newUser.telephone}
                  onChange={handleInputChange}
                  placeholder="Entrez le numéro de téléphone"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="mot_de_passe">Mot de passe</label>
                <input
                  type="password"
                  id="mot_de_passe"
                  className="v0-form-control"
                  name="mot_de_passe"
                  value={newUser.mot_de_passe}
                  onChange={handleInputChange}
                  required
                  placeholder="Entrez le mot de passe"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="role">Rôle</label>
                <select
                  id="role"
                  className="v0-form-control"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                >
                  <option value="client">Client</option>
                  <option value="expert">Expert</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {newUser.role === "expert" && (
                <div className="v0-form-group">
                  <label htmlFor="numero_professionnel">Numéro professionnel</label>
                  <input
                    type="text"
                    id="numero_professionnel"
                    className="v0-form-control"
                    name="numero_professionnel"
                    value={newUser.numero_professionnel || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez le numéro professionnel"
                  />
                </div>
              )}

              <div className="v0-form-actions">
                <button type="submit" className="v0-btn-new-user">
                  <Plus size={16} />
                  <span>Ajouter</span>
                </button>
                <button type="button" className="v0-btn v0-btn-outline" onClick={() => setActiveView("list")}>
                  <X size={16} />
                  <span>Annuler</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersManager
