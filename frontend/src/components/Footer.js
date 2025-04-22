import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import "../styles.css"

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-company">
            <div className="footer-logo">
              <span className="logo-text">
                <span className="logo-secondary">MiaCorp</span>
              </span>
            </div>
            <p className="footer-description">
              MiaCorp simplifie vos démarches juridiques et administratives pour la création et la gestion de votre
              entreprise. Notre plateforme combine expertise juridique et technologie pour vous offrir un service
              complet, rapide et fiable.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link">
                <Facebook size={20} />
              </a>
              <a href="#" className="social-link">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links-container">
            <div className="footer-links-column">
              <h3 className="footer-links-title">Nos Services</h3>
              <ul className="footer-links">
                <li>
                  <a href="#">Création d'entreprise</a>
                </li>
                <li>
                  <a href="#">Modification d'entreprise</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3 className="footer-links-title">Création d'entreprise</h3>
              <ul className="footer-links">
                <li>
                  <a href="#">SARL</a>
                </li>
                <li>
                  <a href="#">SAS</a>
                </li>
                <li>
                  <a href="#">SASU</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3 className="footer-links-title">Modification d'entreprise</h3>
              <ul className="footer-links">
                <li>
                  <a href="#">Changement de siège social</a>
                </li>
                <li>
                  <a href="#">Modification d'objet social</a>
                </li>
                <li>
                  <a href="#">Changement de dirigeant</a>
                </li>
                <li>
                  <a href="#">Augmentation de capital</a>
                </li>
                <li>
                  <a href="#">Cession de parts</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3 className="footer-links-title">Ressources</h3>
              <ul className="footer-links">
                <li>
                  <a href="#">Blog juridique</a>
                </li>
                <li>
                  <a href="#">Guides pratiques</a>
                </li>
                <li>
                  <a href="#">Modèles de documents</a>
                </li>
                <li>
                  <a href="#">FAQ</a>
                </li>
                <li>
                  <a href="#">Glossaire juridique</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">© {new Date().getFullYear()} MiaCorp. Tous droits réservés.</div>
          <div className="footer-legal-links">
            <a href="#">Mentions légales</a>
            <a href="#">Politique de confidentialité</a>
            <a href="#">CGU</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
