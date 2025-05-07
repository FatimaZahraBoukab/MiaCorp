"use client"
import { Routes, Route, Navigate } from "react-router-dom"
import ClientLayout from "./components/ClientLayout"
import Dashboard from "./components/Dashboard"
import CreationEntreprise from "./components/CreationEntreprise"
import ModificationEntreprise from "./components/ModificationEntreprise"
import MesDemarches from "./components/MesDemarches"
import Support from "./components/Support"
import Profile from "./components/Profile"

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

const Client = () => {
  // Vérifier si l'utilisateur est authentifié
  const token = localStorage.getItem("token")
  if (!token) {
    return <Navigate to="/login" />
  }

  return <ClientRoutes />
}

export default Client
