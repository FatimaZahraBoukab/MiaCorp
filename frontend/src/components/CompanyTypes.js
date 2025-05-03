"use client"

import "../styles.css"
import { useNavigate } from "react-router-dom"

const CompanyTypes = () => {
  const navigate = useNavigate()

  const handleLearnMore = (type) => {
    navigate(`/company-type/${type}`)
  }

  return (
    <section id="pro-section" className="company-types">
      <div className="container">
        <div className="types-header">
          <h2 className="types-title">
            <span className="highlight-purple">Lancez votre projet avec </span>
            <span className="highlight-purple1"> la bonne structure ,</span>
            <span className="highlight-purple"> dès le départ</span>
          </h2>
          <p className="types-subtitle">Choisissez la forme juridique adaptée à votre projet d'entreprise.</p>
        </div>

        <div className="types-grid">
          <div className="type-card">
            <div className="type-image">
              <img src="/images/img3.png" alt="SARL" className="type-img" />
            </div>
            <h3 className="type-heading">SARL</h3>
            <p className="type-text">
              Société à responsabilité limitée, idéale pour les petites et moyennes entreprises avec plusieurs associés.
              Responsabilité limitée aux apports.
            </p>
            <div className="type-button-container">
              <button className="type-button" onClick={() => handleLearnMore("sarl")}>
                En savoir plus sur la SARL
              </button>
            </div>
          </div>

          <div className="type-card">
            <div className="type-image">
              <img src="/images/img7.png" alt="SASU" className="type-img" />
            </div>
            <h3 className="type-heading">SASU</h3>
            <p className="type-text">
              Société par actions simplifiée unipersonnelle, parfaite pour l'entrepreneur solo. Simplicité de gestion et
              protection du patrimoine personnel.
            </p>
            <div className="type-button-container">
              <button className="type-button" onClick={() => handleLearnMore("sasu")}>
                En savoir plus sur la SASU
              </button>
            </div>
          </div>

          <div className="type-card">
            <div className="type-image">
              <img src="/images/img4.jpg" alt="SAS" className="type-img" />
            </div>
            <h3 className="type-heading">SAS</h3>
            <p className="type-text">
              Société par actions simplifiée, flexible et adaptée aux projets innovants. Liberté statutaire et
              responsabilité limitée aux apports.
            </p>
            <div className="type-button-container">
              <button className="type-button" onClick={() => handleLearnMore("sas")}>
                En savoir plus sur la SAS
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


export default CompanyTypes
