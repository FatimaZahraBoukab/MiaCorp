"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, User, Edit } from "lucide-react"
import axios from "axios"

const Profile = () => {
  const [userData, setUserData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    acceptEmails: false,
  })

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [newEmail, setNewEmail] = useState("")
  const [editingEmail, setEditingEmail] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)

  // Récupérer les données de l'utilisateur
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")

      // Vérifier si le token existe
      if (!token) {
        setError("Vous n'êtes pas connecté. Veuillez vous connecter à nouveau.")
        setLoading(false)
        return
      }

      const response = await axios.get("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUserData({
        prenom: response.data.prenom || "",
        nom: response.data.nom || "",
        email: response.data.email || "",
        telephone: response.data.telephone || "",
        acceptEmails: response.data.acceptEmails || false,
      })

      // Calculer le pourcentage de complétion du profil
      calculateCompletionPercentage(response.data)

      setLoading(false)
    } catch (err) {
      console.error("Erreur lors de la récupération des données utilisateur:", err)

      // Gérer spécifiquement l'erreur 401 sans redirection automatique
      if (err.response && err.response.status === 401) {
        setError("Problème d'authentification. Veuillez vérifier que vous êtes bien connecté.")
      } else {
        setError("Impossible de récupérer vos informations. Veuillez réessayer plus tard.")
      }

      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const calculateCompletionPercentage = (data) => {
    const fields = ["prenom", "nom", "email", "telephone"]
    const filledFields = fields.filter((field) => data[field] && data[field].trim() !== "").length
    const percentage = Math.round((filledFields / fields.length) * 100)
    setCompletionPercentage(percentage)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setUserData({
      ...userData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswords({
      ...passwords,
      [name]: value,
    })
  }

  // Modifier la fonction handleProfileUpdate pour ne pas déconnecter l'utilisateur après une mise à jour réussie
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (!token) {
      setError("Vous n'êtes pas connecté. Veuillez vous connecter à nouveau.")
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
      return
    }

    try {
      await axios.put(
        "http://localhost:8000/users/me",
        {
          prenom: userData.prenom,
          nom: userData.nom,
          telephone: userData.telephone,
          acceptEmails: userData.acceptEmails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccess("Vos informations ont été mises à jour avec succès.")
      calculateCompletionPercentage(userData)
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err)

      // Ne déconnecter que si l'erreur est 401 et ne pas rediriger automatiquement
      if (err.response && err.response.status === 401) {
        setError("Problème d'authentification. Veuillez vérifier que vous êtes bien connecté.")
      } else {
        setError("Une erreur est survenue lors de la mise à jour de votre profil.")
      }
    }
  }

  // Modifier la fonction handleEmailUpdate pour ne pas déconnecter l'utilisateur après une mise à jour réussie
  const handleEmailUpdate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!newEmail) {
      setError("Veuillez entrer un email valide.")
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous n'êtes pas connecté.")
        return
      }

      await axios.put(
        "http://localhost:8000/users/me",
        {
          email: newEmail,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccess("Votre email a été mis à jour avec succès.")
      setUserData({
        ...userData,
        email: newEmail,
      })
      setEditingEmail(false)
      setNewEmail("")
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'email:", err)

      if (err.response && err.response.status === 401) {
        setError("Problème d'authentification. Veuillez vérifier que vous êtes bien connecté.")
      } else {
        setError("Une erreur est survenue lors de la mise à jour de votre email.")
      }
    }
  }

  // Modifier la fonction handlePasswordUpdate pour ne pas déconnecter l'utilisateur après une mise à jour réussie
  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous n'êtes pas connecté.")
        return
      }

      await axios.put(
        "http://localhost:8000/users/me",
        {
          mot_de_passe: passwords.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccess("Votre mot de passe a été mis à jour avec succès.")
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      console.error("Erreur lors de la mise à jour du mot de passe:", err)

      if (err.response && err.response.status === 401) {
        setError("Problème d'authentification. Veuillez vérifier que vous êtes bien connecté.")
      } else {
        setError("Une erreur est survenue lors de la mise à jour de votre mot de passe.")
      }
    }
  }

  const togglePasswordVisibility = (field) => {
    if (field === "current") {
      setShowCurrentPassword(!showCurrentPassword)
    } else if (field === "new") {
      setShowNewPassword(!showNewPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  if (loading) {
    return <div className="profile-container8">Chargement...</div>
  }

  return (
    <div className="profile-container8">
      <h1 className="profile-title8">Profil</h1>

      {error && <div className="error-message8">{error}</div>}
      {success && <div className="success-message8">{success}</div>}

      <div className="profile-layout8">
        <div className="profile-main-section8">
          <div className="profile-header8">
            <div className="profile-avatar-container8">
              <div className="profile-avatar8">
                <User size={60} />
              </div>
            </div>
            <div className="profile-info8">
              <div className="profile-email8">{userData.email}</div>
              <div className="profile-completion8">
                <div className="profile-completion-text8"> Gérez votre profil</div>
                <div className="profile-completion-bar-container8">
                  <div className="profile-completion-bar8">
                    <div className="profile-completion-progress8" style={{ width: `${completionPercentage}%` }}></div>
                  </div>
                  
                </div>
                <div className="profile-completion-message8">
                  Moi c'est MiaCorp, et vous ? <span className="profile-emoji8">😊</span>
                </div>
              </div>
              
            </div>
          </div>

          <div className="profile-section8">
            <h2 className="profile-section-title8">Mes informations</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="profile-form-row8">
                <div className="profile-form-group8">
                  <label htmlFor="prenom">Prénom</label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={userData.prenom}
                    onChange={handleInputChange}
                    className="profile-input8"
                    placeholder="Mon prénom"
                  />
                </div>

                <div className="profile-form-group8">
                  <label htmlFor="nom">Nom</label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={userData.nom}
                    onChange={handleInputChange}
                    className="profile-input8"
                    placeholder="Mon nom"
                  />
                </div>
              </div>

              <div className="profile-form-group8">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={userData.telephone}
                  onChange={handleInputChange}
                  className="profile-input8"
                  placeholder="06 00 00 00 00"
                />
              </div>

              {editingEmail ? (
                <div className="profile-form-group8">
                  <label htmlFor="newEmail">Email</label>
                  <input
                    type="email"
                    id="newEmail"
                    name="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="profile-input8"
                    placeholder="nouveau@email.com"
                  />
                  <div className="profile-form-actions8">
                    <button type="button" className="profile-cancel-button8" onClick={() => setEditingEmail(false)}>
                      Annuler
                    </button>
                    <button type="button" className="profile-update-button8" onClick={handleEmailUpdate}>
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-form-group8">
                  <label htmlFor="email">Email</label>
                  <div className="profile-email-container8">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={userData.email}
                      readOnly
                      className="profile-input8 profile-input-readonly8"
                    />
                    <button type="button" className="profile-edit-button8" onClick={() => setEditingEmail(true)}>
                      <Edit size={16} />
                      Modifier
                    </button>
                  </div>
                </div>
              )}

              

              <button type="submit" className="profile-update-button8">
                Mettre à jour
              </button>
            </form>
          </div>

          <div className="profile-section8">
            <h2 className="profile-section-title8">Nouveau mot de passe</h2>
            <form onSubmit={handlePasswordUpdate}>
              <div className="profile-form-group8 password-input-container8">
                <label htmlFor="currentPassword">Mot de passe actuel</label>
                <div className="password-input-wrapper8">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    className="profile-input8"
                    placeholder="Entrez votre mot de passe actuel"
                  />
                  <button
                    type="button"
                    className="password-toggle-button8"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="profile-form-group8 password-input-container8">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <div className="password-input-wrapper8">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    className="profile-input8"
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                  <button
                    type="button"
                    className="password-toggle-button8"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="profile-form-group8 password-input-container8">
                <label htmlFor="confirmPassword">Confirmation du mot de passe</label>
                <div className="password-input-wrapper8">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    className="profile-input8"
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                  <button
                    type="button"
                    className="password-toggle-button8"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="profile-update-button8">
                Mettre à jour
              </button>
            </form>
          </div>
        </div>

        
        
      </div>
    </div>
  )
}

export default Profile
