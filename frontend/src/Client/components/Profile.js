"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
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
    newPassword: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Récupérer les données de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token")
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

        setLoading(false)
      } catch (err) {
        console.error("Erreur lors de la récupération des données utilisateur:", err)
        setError("Impossible de récupérer vos informations. Veuillez réessayer plus tard.")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
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
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err)
      setError("Une erreur est survenue lors de la mise à jour de votre profil.")
    }
  }

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
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      console.error("Erreur lors de la mise à jour du mot de passe:", err)
      setError("Une erreur est survenue lors de la mise à jour de votre mot de passe.")
    }
  }

  const togglePasswordVisibility = (field) => {
    if (field === "new") {
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
      <h1 className="profile-title8">Mes informations</h1>

      {error && <div className="error-message8">{error}</div>}
      {success && <div className="success-message8">{success}</div>}

      <div className="profile-section8">
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

          <div className="profile-form-group8">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              readOnly
              className="profile-input8 profile-input-readonly8"
            />
            <button type="button" className="profile-link-button8">
              Modifier mon email
            </button>
          </div>

          <div className="profile-checkbox-group8">
            <input
              type="checkbox"
              id="acceptEmails"
              name="acceptEmails"
              checked={userData.acceptEmails}
              onChange={handleInputChange}
            />
            <label htmlFor="acceptEmails">
              J'accepte que MiaCorp m'envoie des informations sur des promotions ou des services fournis par MiaCorp
              (promis, que des informations utiles, pas de spam !)
            </label>
          </div>

          <button type="submit" className="profile-update-button8">
            Mettre à jour
          </button>
        </form>
      </div>

      <div className="profile-section8">
        <h2 className="profile-subtitle8">Nouveau mot de passe</h2>

        <form onSubmit={handlePasswordUpdate}>
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
              <button type="button" className="password-toggle-button8" onClick={() => togglePasswordVisibility("new")}>
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
                placeholder="Entrez votre nouveau mot de passe"
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

          <button type="submit" className="profile-update-button8 password-update-button8">
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
