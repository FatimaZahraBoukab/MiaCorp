
import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom" 
import { Search, User } from "lucide-react"
import "../styles.css"

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate() 

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

  return (
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="container header-container">
        <div className="logo-container">
          
          <span className="logo-text">
            <span className="logo-primary">Mia</span>
            <span className="logo-secondary">Corp</span>
          </span>
        </div>

        <nav className="main-nav">
          <div className="nav-item dropdown">
            <span>Création d'entreprise</span>
    
          </div>
          <div className="nav-item dropdown">
            <span>Gestion d'entreprise</span>
           
          </div>
          <div className="nav-item dropdown">
            <span>Nos Services</span>
            
          </div>
          <div className="nav-item dropdown">
            <span>Espace Pro</span>
            
          </div>
          <div className="nav-item dropdown">
            <span>Contact</span>
            
          </div>
        </nav>

        <div className="header-actions">
          <button className="search-button">
            <Search size={20} />
          </button>
          <button className="phone-button">06 11 95 58 23</button>
          <Link to="/login" className="user-button">
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
