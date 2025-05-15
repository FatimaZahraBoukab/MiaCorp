"use client"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import ClientLayout from "./components/ClientLayout"
import Dashboard from "./components/Dashboard"
import CreationEntreprise from "./components/CreationEntreprise"
import ModificationEntreprise from "./components/ModificationEntreprise"
import MesDemarches from "./components/MesDemarches"
import Support from "./components/Support"
import Profile from "./components/Profile"
import { useState, useEffect } from "react"
import axios from "axios"
import "./styles/client.css"
import "./styles/creation-entreprise.css"
import "./styles/mes-demarches.css"

const ClientRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="creation" element={<CreationEntreprise />} />
        <Route path="modification" element={<ModificationEntreprise />} />
        <Route path="demarches" element={<MesDemarches />} />
        <Route path="support" element={<Support />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/client" replace />} />
      </Route>
    </Routes>
  )
}

// Modifier la fonction de vérification du token pour ne pas rediriger automatiquement
const Client = () => {
  // Vérifier si l'utilisateur est authentifié
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsAuthenticated(false)
      setIsLoading(false)
      navigate("/login")
      return
    }

    // Vérifier la validité du token
    const verifyToken = async () => {
      try {
        // Ajouter un paramètre timestamp pour éviter la mise en cache
        await axios.get(`http://localhost:8000/users/me?timestamp=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (err) {
        console.error("Erreur de vérification du token:", err)

        // Gérer les erreurs d'authentification
        if (err.response && err.response.status === 401) {
          console.log("Token invalide ou expiré")
          // Optionnel: supprimer le token invalide
          // localStorage.removeItem("token")
          setIsAuthenticated(false)

          // Afficher un message à l'utilisateur (vous pouvez utiliser un état pour cela)
          alert("Votre session a expiré. Veuillez vous reconnecter.")
          navigate("/login")
        } else {
          // Pour les autres erreurs, considérer l'utilisateur comme authentifié
          // mais enregistrer l'erreur pour le débogage
          console.warn("Erreur lors de la vérification du token, mais on continue:", err)
          setIsAuthenticated(true)
        }
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [navigate])

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <ClientRoutes />
}

export default Client
