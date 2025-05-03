"use client"
import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Header from "./components/Header"
import Hero from "./components/Hero"
import Steeps from "./components/Steeps"
import Advantages from "./components/Advantages"
import BusinessStages from "./components/BusinessStages"
import CompanyTypes from "./components/CompanyTypes"
import Testimonials from "./components/Testimonials"
import FAQ from "./components/FAQ"
import Contact from "./components/Contact"
import Footer from "./components/Footer"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ClientWelcome from "./pages/ClientWelcome"
import AdminDashboard from "./pages/AdminDashboard"

import ExpertDashboard from "./pages/ExpertDashboard"
import CompanyTypeDetail from "./pages/CompanyTypeDetail"
import BusinessCreation from "./pages/BusinessCreation"
import BusinessModification from "./pages/BusinessModification"
import BusinessCreationInfo from "./pages/BusinessCreationInfo"
import "./App.css"
import "./styles.css"
import "./styles-company-detail.css"


// ...le reste de ton code

// Composant pour protéger les routes
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token")
  return token ? element : <Navigate to="/login" />
}

// Composant pour gérer le défilement après la navigation
const ScrollToSection = () => {
  const location = useLocation()

  useEffect(() => {
    // Vérifier si nous avons un état avec une instruction de défilement
    if (location.state && location.state.scrollTo) {
      const sectionId = location.state.scrollTo
      const section = document.getElementById(sectionId)

      if (section) {
        // Petit délai pour s'assurer que le DOM est complètement chargé
        setTimeout(() => {
          section.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
  }, [location])

  return null
}

function App() {
  return (
    <Router>
      <ScrollToSection />
      <Routes>
        <Route
          path="/"
          element={
            <div className="app">
              <Header />
              <main>
                <Hero />
                <Steeps />
                <Advantages />
                <BusinessStages />
                <CompanyTypes />
                <Testimonials />
                <FAQ />
                <Contact />
                <Footer />
              </main>
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/company-type/:type" element={<CompanyTypeDetail />} />
        <Route path="/business-creation" element={<BusinessCreation />} />
        <Route path="/business-modification" element={<BusinessModification />} />
        <Route path="/business-creation-info" element={<BusinessCreationInfo />} />
        <Route path="/client" element={<ProtectedRoute element={<ClientWelcome />} />} />
        <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
        
        <Route path="/expert" element={<ProtectedRoute element={<ExpertDashboard />} />} />
      </Routes>
    </Router>
  )
}

export default App