"use client"

import { useState, useEffect } from "react"
import { Search, User } from "lucide-react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import SearchModal from "./SearchModal"
import "../styles.css"

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [scrolled])

  // Empêcher le défilement du body quand le modal de recherche est ouvert
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [searchOpen])

  const scrollToSection = (sectionId) => {
    // Si nous sommes sur la page d'accueil
    if (location.pathname === "/") {
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // Si nous sommes sur une autre page, naviguer vers la page d'accueil puis défiler
      navigate("/", { state: { scrollTo: sectionId } })
    }
  }

  const toggleSearch = () => {
    setSearchOpen(!searchOpen)
  }

  return (
    <>
      <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
        <div className="container header-container">
          <div className="logo-container">
            <span className="logo-text">
              <span className="logo-primary">Mia</span>
              <span className="logo-secondary">Corp</span>
            </span>
          </div>

          <nav className="main-nav">
          <div
  className="nav-item dropdown"
  onClick={() => navigate("/business-creation")}
  style={{ cursor: "pointer" }}
>
  <span>Création d'entreprise</span>
</div>

<div
  className="nav-item dropdown"
  onClick={() => navigate("/business-modification")}
  style={{ cursor: "pointer" }}
>
  <span>Gestion d'entreprise</span>
</div>

            <div
              className="nav-item dropdown"
              onClick={() => scrollToSection("services-section")}
              style={{ cursor: "pointer" }}
            >
              <span>Nos Services</span>
            </div>
            <div
              className="nav-item dropdown"
              onClick={() => scrollToSection("pro-section")}
              style={{ cursor: "pointer" }}
            >
              <span>Espace Pro</span>
            </div>
            <div
              className="nav-item12 dropdown"
              onClick={() => scrollToSection("contact-section")}
              style={{ cursor: "pointer" }}
            >
              <span>Contact</span>
            </div>
          </nav>

          <div className="header-actions">
            <button className="search-button" onClick={toggleSearch}>
              <Search size={20} />
            </button>
            <button className="phone-button">06 11 95 58 23</button>
            <Link to="/login" className="user-button">
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default Header
