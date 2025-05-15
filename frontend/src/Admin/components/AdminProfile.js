"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, Shield, Key, Save, Camera, X, Edit, Lock } from "lucide-react"
import "./AdminProfile.css"

const AdminProfile = ({ admin, updateProfile, changePassword, updateAvatar, setSuccessMsg, setErrorMsg }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "",
    avatar: null,
  })
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Mettre à jour les données du formulaire lorsque les données de l'admin changent
  useEffect(() => {
    if (admin) {
      setFormData({
        nom: admin.nom || "",
        prenom: admin.prenom || "",
        email: admin.email || "",
        telephone: admin.telephone || "",
        role: admin.role || "admin",
      })
      setAvatarPreview(admin.avatar || null)
    }
  }, [admin])

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (admin) {
      // Utiliser les deux premières lettres du prénom et du nom si disponibles
      const firstInitial = admin.prenom ? admin.prenom.charAt(0).toLowerCase() : ""
      const lastInitial = admin.nom ? admin.nom.charAt(0).toLowerCase() : ""
      return firstInitial + lastInitial
    }
    return "at" // Valeur par défaut comme dans l'image
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
    }

    // Appeler la fonction de mise à jour du profil
    const success = await updateProfile(dataToUpdate)

    if (success) {
      // Si l'avatar a été modifié, le mettre à jour également
      if (avatarFile) {
        await updateAvatar(avatarFile)
      }

      setIsEditing(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    // Appeler la fonction de changement de mot de passe
    const success = await changePassword(currentPassword, newPassword)

    if (success) {
      setPasswordError("")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
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

  // Si les données de l'admin ne sont pas encore chargées
  if (!admin) {
    return (
      <div className="v0-loading-state">
        <div className="v0-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    )
  }

  return (
    <div className="v0-admin-profile">
      <div className="v0-profile-header">
        <h2>Profil Administrateur</h2>
        {!isEditing ? (
          <button className="v0-btn-edit-profile" onClick={() => setIsEditing(true)}>
            <Edit size={16} />
            <span>Modifier le profil</span>
          </button>
        ) : (
          <button
            className="v0-btn v0-btn-outline"
            onClick={() => {
              setIsEditing(false)
              setFormData({
                nom: admin.nom || "",
                prenom: admin.prenom || "",
                email: admin.email || "",
                telephone: admin.telephone || "",
                role: admin.role || "admin",
              })
              setAvatarPreview(admin.avatar || null)
              setAvatarFile(null)
            }}
          >
            <X size={16} />
            <span>Annuler</span>
          </button>
        )}
      </div>

      <div className="v0-profile-content">
        <div className="v0-profile-sidebar">
          <div className="v0-profile-avatar-container">
            {avatarPreview ? (
              <img src={avatarPreview || "/placeholder.svg"} alt="Avatar" className="v0-profile-avatar" />
            ) : (
              <div className="v0-profile-avatar-placeholder">
                <span>{getUserInitials()}</span>
              </div>
            )}

            {isEditing && (
              <div className="v0-avatar-upload">
                <label htmlFor="avatar-upload" className="v0-avatar-upload-label">
                  <Camera size={20} />
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="v0-avatar-upload-input"
                />
              </div>
            )}
          </div>

          <div className="v0-profile-info">
            <h3>
              {admin.prenom} {admin.nom}
            </h3>
            <span className="v0-profile-role">ADMIN</span>

            <div className="v0-profile-stats">
              <div className="v0-profile-stat">
                <span className="v0-stat-label">Date de création</span>
                <span className="v0-stat-value1">
                  {admin.date_inscription ? new Date(admin.date_inscription).toLocaleDateString("fr-FR") : "01/05/2025"}
                </span>
              </div>
              <div className="v0-profile-stat">
                <span className="v0-stat-label">Dernière connexion</span>
                <span className="v0-stat-value1">{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="v0-profile-details">
          <div className="v0-profile-section">
            <h3>Informations personnelles</h3>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="v0-form-group">
                  <label htmlFor="prenom">
                    <User size={16} />
                    <span>Prénom</span>
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    className="v0-form-control"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez votre prénom"
                  />
                </div>

                <div className="v0-form-group">
                  <label htmlFor="nom">
                    <User size={16} />
                    <span>Nom</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    className="v0-form-control"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    placeholder="Entrez votre nom"
                  />
                </div>

                <div className="v0-form-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="v0-form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="exemple@email.com"
                  />
                </div>

                <div className="v0-form-group">
                  <label htmlFor="telephone">
                    <Phone size={16} />
                    <span>Téléphone</span>
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    className="v0-form-control"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder="Entrez votre numéro de téléphone"
                  />
                </div>

                <div className="v0-form-group">
                  <label htmlFor="role">
                    <Shield size={16} />
                    <span>Rôle</span>
                  </label>
                  <input type="text" id="role" name="role" className="v0-form-control" value={formData.role} disabled />
                </div>

                <div className="v0-form-actions">
                  <button type="submit" className="v0-btn-edit-profile">
                    <Save size={16} />
                    <span>Enregistrer</span>
                  </button>
                  <button
                    type="button"
                    className="v0-btn v0-btn-outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        nom: admin.nom || "",
                        prenom: admin.prenom || "",
                        email: admin.email || "",
                        telephone: admin.telephone || "",
                        role: admin.role || "admin",
                      })
                      setAvatarPreview(admin.avatar || null)
                      setAvatarFile(null)
                    }}
                  >
                    <X size={16} />
                    <span>Annuler</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="v0-profile-info-list">
                <div className="v0-profile-info-item">
                  <div className="v0-info-label">
                    <User size={16} />
                    <span>Prénom</span>
                  </div>
                  <div className="v0-info-value">{admin.prenom || "admin"}</div>
                </div>

                <div className="v0-profile-info-item">
                  <div className="v0-info-label">
                    <User size={16} />
                    <span>Nom</span>
                  </div>
                  <div className="v0-info-value">{admin.nom || "the"}</div>
                </div>

                <div className="v0-profile-info-item">
                  <div className="v0-info-label">
                    <Mail size={16} />
                    <span>Email</span>
                  </div>
                  <div className="v0-info-value">{admin.email || "theadmin@gmail.com"}</div>
                </div>

                <div className="v0-profile-info-item">
                  <div className="v0-info-label">
                    <Phone size={16} />
                    <span>Téléphone</span>
                  </div>
                  <div className="v0-info-value">{admin.telephone || "0666554489"}</div>
                </div>

                <div className="v0-profile-info-item">
                  <div className="v0-info-label">
                    <Shield size={16} />
                    <span>Rôle</span>
                  </div>
                  <div className="v0-info-value">{admin.role || "admin"}</div>
                </div>
              </div>
            )}
          </div>

          <div className="v0-profile-section">
            <h3>Sécurité</h3>

            <form onSubmit={handlePasswordChange}>
              <div className="v0-form-group">
                <label htmlFor="current-password">
                  <Key size={16} />
                  <span>Mot de passe actuel</span>
                </label>
                <input
                  type="password"
                  id="current-password"
                  className="v0-form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="new-password">
                  <Key size={16} />
                  <span>Nouveau mot de passe</span>
                </label>
                <input
                  type="password"
                  id="new-password"
                  className="v0-form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>

              <div className="v0-form-group">
                <label htmlFor="confirm-password">
                  <Key size={16} />
                  <span>Confirmer le mot de passe</span>
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  className="v0-form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>

              {passwordError && <div className="v0-notification v0-error">{passwordError}</div>}

              <div className="v0-form-actions">
                <button type="submit" className="v0-btn-change-password">
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

export default AdminProfile
