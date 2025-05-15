"use client"

import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import "../styles/client.css"
import { useState, useEffect } from "react"

const ClientLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    // Récupérer l'état de la sidebar depuis localStorage
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null && !isMobile) {
      setSidebarCollapsed(savedState === "true")
    }

    // Écouter les changements d'état de la sidebar
    const handleStorageChange = () => {
      const currentState = localStorage.getItem("sidebarCollapsed")
      if (currentState !== null) {
        setSidebarCollapsed(currentState === "true")
      }
    }

    // Écouter l'événement personnalisé de basculement de la sidebar
    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(event.detail.collapsed)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("sidebarToggle", handleSidebarToggle)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
    }
  }, [])

  return (
    <div className={`app-container8 ${sidebarCollapsed ? "sidebar-collapsed8" : ""}`}>
      <Sidebar />
      <div className={`main-content8 ${sidebarCollapsed && !isMobile ? "expanded8" : ""}`}>
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ClientLayout
