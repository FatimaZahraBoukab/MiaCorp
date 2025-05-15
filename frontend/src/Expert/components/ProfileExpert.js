"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, Shield, Key, Save, Camera, X, Edit, Lock } from "lucide-react"
import axios from "axios"
import "../profile-expert.css"

const ProfileV5 = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [expert, setExpert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    numero_professionnel: "",
  })

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Charger les données de l'expert au chargement du composant
  useEffect(() => {
    fetchExpertData()
  }, [])

  // Mettre à jour les données du formulaire lorsque les données de l'expert changent
  useEffect(() => {
    if (expert) {
      setFormData({
        nom: expert.nom || "",
        prenom: expert.prenom || "",
        email: expert.email || "",
        telephone: expert.telephone || "",
        numero_professionnel: expert.numero_professionnel || "",
      })
      setAvatarPreview(expert.avatar || null)
    }
  }, [expert])

  // Fonction pour récupérer les données de l'expert
  const fetchExpertData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous devez être connecté pour accéder à votre profil")
        setLoading(false)
        return
      }

      const response = await axios.get("http://localhost:8000/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setExpert(response.data)
      setLoading(false)
    } catch (err) {
      console.error("Erreur lors de la récupération des données de l'expert:", err)
      setError("Erreur lors du chargement du profil")
      setLoading(false)
    }
  }

  // Fonction pour mettre à jour le profil
  const updateProfile = async (data) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous devez être connecté pour modifier votre profil")
        return false
      }

      const response = await axios.put("http://localhost:8000/users/me", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      setExpert(response.data)
      setSuccessMessage("Profil mis à jour avec succès")

      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      return true
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err)
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour du profil")
      return false
    }
  }

  // Fonction pour changer le mot de passe
  const changePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        setPasswordError("Les mots de passe ne correspondent pas")
        return false
      }

      if (newPassword.length < 8) {
        setPasswordError("Le mot de passe doit contenir au moins 8 caractères")
        return false
      }

      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous devez être connecté pour changer votre mot de passe")
        return false
      }

      await axios.put(
        "http://localhost:8000/users/me/password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      setSuccessMessage("Mot de passe changé avec succès")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordError("")

      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      return true
    } catch (err) {
      console.error("Erreur lors du changement de mot de passe:", err)
      setPasswordError(err.response?.data?.detail || "Erreur lors du changement de mot de passe")
      return false
    }
  }

  // Fonction pour mettre à jour l'avatar
  const updateAvatar = async () => {
    if (!avatarFile) return false

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous devez être connecté pour modifier votre avatar")
        return false
      }

      const formData = new FormData()
      formData.append("avatar", avatarFile)

      const response = await axios.post("http://localhost:8000/users/me/avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setExpert(response.data)
      setSuccessMessage("Avatar mis à jour avec succès")
      setAvatarFile(null)

      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      return true
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'avatar:", err)
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour de l'avatar")
      return false
    }
  }

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (expert) {
      const firstInitial = expert.prenom ? expert.prenom.charAt(0).toLowerCase() : ""
      const lastInitial = expert.nom ? expert.nom.charAt(0).toLowerCase() : ""
      return firstInitial + lastInitial
    }
    return "ex" // Valeur par défaut pour un expert
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Préparer les données à envoyer au backend
    const dataToUpdate = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.telephone,
      numero_professionnel: formData.numero_professionnel,
    }

    // Appeler la fonction de mise à jour du profil
    const success = await updateProfile(dataToUpdate)

    if (success) {
      // Si l'avatar a été modifié, le mettre à jour également
      if (avatarFile) {
        await updateAvatar()
      }

      setIsEditing(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    await changePassword()
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)

      // Créer une URL pour prévisualiser l'image
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Si les données sont en cours de chargement
  if (loading) {
    return (
      <div className="v5-loading-state">
        <div className="v5-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    )
  }

  // Si une erreur s'est produite
  if (error) {
    return (
      <div className="v5-error-message">
        <p>{error}</p>
        <button onClick={fetchExpertData} className="v5-btn-retry">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="v5-expert-profile">
      <div className="v5-profile-header">
        <h2>Profil Expert</h2>
        {!isEditing ? (
          <button className="v5-btn-edit-profile" onClick={() => setIsEditing(true)}>
            <Edit size={16} />
            <span>Modifier le profil</span>
          </button>
        ) : (
          <button
            className="v5-btn v5-btn-outline"
            onClick={() => {
              setIsEditing(false)
              setFormData({
                nom: expert.nom || "",
                prenom: expert.prenom || "",
                email: expert.email || "",
                telephone: expert.telephone || "",
                numero_professionnel: expert.numero_professionnel || "",
              })
              setAvatarPreview(expert.avatar || null)
              setAvatarFile(null)
            }}
          >
            <X size={16} />
            <span>Annuler</span>
          </button>
        )}
      </div>

      {successMessage && <div className="v5-notification v5-success">{successMessage}</div>}

      <div className="v5-profile-content">
        <div className="v5-profile-sidebar">
          <div className="v5-profile-avatar-container">
            {avatarPreview ? (
              <img src={avatarPreview || "/placeholder.svg"} alt="Avatar" className="v5-profile-avatar" />
            ) : (
              <div className="v5-profile-avatar-placeholder">
                <span>{getUserInitials()}</span>
              </div>
            )}

            {isEditing && (
              <div className="v5-avatar-upload">
                <label htmlFor="avatar-upload" className="v5-avatar-upload-label">
                  <Camera size={20} />
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="v5-avatar-upload-input"
                />
              </div>
            )}
          </div>

          <div className="v5-profile-info">
            <h3>
              {expert?.prenom} {expert?.nom}
            </h3>
            <span className="v5-profile-role">EXPERT</span>

            <div className="v5-profile-stats">
              <div className="v5-profile-stat">
                <span className="v5-stat-label">Date d'inscription</span>
                <span className="v5-stat-value1">
                  {expert?.date_inscription
                    ? new Date(expert.date_inscription).toLocaleDateString("fr-FR")
                    : new Date().toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="v5-profile-stat">
                <span className="v5-stat-label">Dernière connexion</span>
                <span className="v5-stat-value1">{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="v5-profile-details">
          <div className="v5-profile-section">
            <h3>Informations personnelles</h3>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="v5-form-group">
                  <label htmlFor="prenom">
                    <User size={16} />
                    <span>Prénom</span>
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    className="v5-form-control"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez votre prénom"
                  />
                </div>

                <div className="v5-form-group">
                  <label htmlFor="nom">
                    <User size={16} />
                    <span>Nom</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    className="v5-form-control"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez votre nom"
                  />
                </div>

                <div className="v5-form-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="v5-form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="exemple@email.com"
                  />
                </div>

                <div className="v5-form-group">
                  <label htmlFor="telephone">
                    <Phone size={16} />
                    <span>Téléphone</span>
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    className="v5-form-control"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder="Entrez votre numéro de téléphone"
                  />
                </div>

                <div className="v5-form-group">
                  <label htmlFor="numero_professionnel">
                    <Shield size={16} />
                    <span>Numéro professionnel</span>
                  </label>
                  <input
                    type="text"
                    id="numero_professionnel"
                    name="numero_professionnel"
                    className="v5-form-control"
                    value={formData.numero_professionnel}
                    onChange={handleInputChange}
                    placeholder="Entrez votre numéro professionnel"
                  />
                </div>

                <div className="v5-form-group">
                  <label htmlFor="role">
                    <Shield size={16} />
                    <span>Rôle</span>
                  </label>
                  <input type="text" id="role" name="role" className="v5-form-control" value="expert" disabled />
                </div>

                <div className="v5-form-actions">
                  <button type="submit" className="v5-btn-edit-profile">
                    <Save size={16} />
                    <span>Enregistrer</span>
                  </button>
                  <button
                    type="button"
                    className="v5-btn v5-btn-outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        nom: expert.nom || "",
                        prenom: expert.prenom || "",
                        email: expert.email || "",
                        telephone: expert.telephone || "",
                        numero_professionnel: expert.numero_professionnel || "",
                      })
                      setAvatarPreview(expert.avatar || null)
                      setAvatarFile(null)
                    }}
                  >
                    <X size={16} />
                    <span>Annuler</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="v5-profile-info-list">
                <div className="v5-profile-info-item">
                  <div className="v5-info-label">
                    <User size={16} />
                    <span>Prénom</span>
                  </div>
                  <div className="v5-info-value">{expert?.prenom || "Non renseigné"}</div>
                </div>

                <div className="v5-profile-info-item">
                  <div className="v5-info-label">
                    <User size={16} />
                    <span>Nom</span>
                  </div>
                  <div className="v5-info-value">{expert?.nom || "Non renseigné"}</div>
                </div>

                <div className="v5-profile-info-item">
                  <div className="v5-info-label">
                    <Mail size={16} />
                    <span>Email</span>
                  </div>
                  <div className="v5-info-value">{expert?.email || "Non renseigné"}</div>
                </div>

                <div className="v5-profile-info-item">
                  <div className="v5-info-label">
                    <Phone size={16} />
                    <span>Téléphone</span>
                  </div>
                  <div className="v5-info-value">{expert?.telephone || "Non renseigné"}</div>
                </div>

                <div className="v5-profile-info-item">
                  <div className="v5-info-label">
                    <Shield size={16} />
                    <span>Numéro professionnel</span>
                  </div>
                  <div className="v5-info-value">{expert?.numero_professionnel || "Non renseigné"}</div>
                </div>

                <div className="v5-profile-info-item">
                  <div className="v5-info-label">
                    <Shield size={16} />
                    <span>Rôle</span>
                  </div>
                  <div className="v5-info-value">{expert?.role || "expert"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="v5-profile-section">
            <h3>Sécurité</h3>

            <form onSubmit={handlePasswordChange}>
              <div className="v5-form-group">
                <label htmlFor="current-password">
                  <Key size={16} />
                  <span>Mot de passe actuel</span>
                </label>
                <input
                  type="password"
                  id="current-password"
                  className="v5-form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>

              <div className="v5-form-group">
                <label htmlFor="new-password">
                  <Key size={16} />
                  <span>Nouveau mot de passe</span>
                </label>
                <input
                  type="password"
                  id="new-password"
                  className="v5-form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>

              <div className="v5-form-group">
                <label htmlFor="confirm-password">
                  <Key size={16} />
                  <span>Confirmer le mot de passe</span>
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  className="v5-form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>

              {passwordError && <div className="v5-notification v5-error">{passwordError}</div>}

              <div className="v5-form-actions">
                <button type="submit" className="v5-btn-change-password">
                  <Lock size={16} />
                  <span>Changer le mot de passe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileV5
