"use client"

import React from "react"
import { Menu } from "lucide-react"
import "../sidebar.css"

const HeaderV5 = ({ toggleSidebar, setActiveTab }) => {
  // Fonction pour naviguer vers la page de profil
  const goToProfile = () => {
    if (setActiveTab) {
      setActiveTab("profile")
    } else {
      // Si setActiveTab n'est pas disponible, on peut utiliser l'événement personnalisé
      // comme dans le composant Dashboard
      if (typeof window !== "undefined") {
        const event = new CustomEvent("changeTab", { detail: { tab: "profile" } })
        window.dispatchEvent(event)
      }
    }
  }

  return React.createElement(
    "div",
    { className: "v5-header" },
    React.createElement(
      "div",
      { className: "v5-header-left" },
      React.createElement(
        "button",
        { className: "v5-menu-toggle", onClick: toggleSidebar },
        React.createElement(Menu, { size: 24 }),
      ),
    ),
    React.createElement(
      "div",
      { className: "v5-header-right" },
      React.createElement(
        "div",
        { className: "v5-user-profile" },
        React.createElement(
          "div",
          {
            className: "v5-avatar",
            onClick: goToProfile,
            style: { cursor: "pointer" },
          },
          React.createElement("span", null, "E"),
        ),
      ),
    ),
  )
}

export default HeaderV5
