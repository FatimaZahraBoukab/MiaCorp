"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import Footer from "../components/Footer"
import Header from "../components/Header"

const CompanyTypeDetail = () => {
  const { type } = useParams()
  const [companyData, setCompanyData] = useState(null)

  useEffect(() => {
    // Données pour chaque type d'entreprise
    const companyTypes = {
        sarl: {
          title: "SARL",
          fullTitle: "Société à Responsabilité Limitée",
          image: "/images/img3.png",
          description:
            "La SARL est une société commerciale composée de 2 à 100 associés. Elle est encadrée par la loi et convient particulièrement aux petites et moyennes entreprises familiales. La responsabilité des associés est limitée au montant de leurs apports.",
          advantages: [
            "Responsabilité limitée des associés",
            "Cadre juridique sécurisé, encadré par la loi",
            "Idéale pour les projets en famille ou entre associés de confiance",
            "Peut opter pour l'impôt sur le revenu sous conditions",
            "Pas de capital social minimum imposé (1€ symbolique possible)"
          ],
          disadvantages: [
            "Souplesse de fonctionnement limitée par rapport à une SAS",
            "Régime social du gérant majoritaire moins protecteur (TNS)",
            "Statuts assez rigides, difficile à modifier",
            "Peu attractive pour les investisseurs externes",
            "Formalités de gestion parfois lourdes"
          ],
          steps: [
            "Rédaction des statuts avec les associés",
            "Dépôt des apports en capital (en numéraire ou en nature)",
            "Publication d’une annonce légale de constitution",
            "Dépôt du dossier de création au greffe",
            "Obtention du Kbis après immatriculation au RCS"
          ]
        },
        sasu: {
          title: "SASU",
          fullTitle: "Société par Actions Simplifiée Unipersonnelle",
          image: "/images/img7.png",
          description:
            "La SASU est une société par actions simplifiée à associé unique. Elle permet à une seule personne de créer une société avec une grande liberté statutaire. Elle est souvent choisie pour son image professionnelle et sa flexibilité.",
          advantages: [
            "Responsabilité limitée à l’apport",
            "Souplesse dans la rédaction des statuts",
            "Président assimilé salarié (protection sociale complète)",
            "Facilité d’évolution vers une SAS avec plusieurs associés",
            "Capital social librement fixé (à partir de 1€)"
          ],
          disadvantages: [
            "Cotisations sociales plus élevées (URSSAF, retraite, etc.)",
            "Pas d'assurance chômage pour le président",
            "Obligations comptables similaires à celles des grandes entreprises",
            "Coût de fonctionnement plus élevé qu'une micro-entreprise",
            "Moins adapté si le projet est très simple"
          ],
          steps: [
            "Rédaction des statuts par l'associé unique",
            "Dépôt du capital social en banque",
            "Publication dans un journal d'annonces légales",
            "Dépôt du dossier au greffe du tribunal de commerce",
            "Immatriculation au Registre du Commerce et des Sociétés (RCS)"
          ]
        },
        sas: {
          title: "SAS",
          fullTitle: "Société par Actions Simplifiée",
          image: "/images/img4.jpg",
          description:
            "La SAS est une société commerciale très flexible, adaptée aux projets innovants ou aux entreprises en croissance. Elle permet une organisation sur mesure grâce à une grande liberté dans la rédaction des statuts.",
          advantages: [
            "Responsabilité limitée des associés",
            "Liberté totale dans la gestion (statuts personnalisables)",
            "Structure idéale pour accueillir des investisseurs",
            "Image professionnelle auprès des partenaires",
            "Capital social libre à partir de 1€"
          ],
          disadvantages: [
            "Formalités juridiques et comptables importantes",
            "Charges sociales élevées pour les dirigeants",
            "Nécessite des statuts bien rédigés (souvent avec un expert)",
            "Pas d’assurance chômage pour le président",
            "Coûts de fonctionnement supérieurs à une SARL"
          ],
          steps: [
            "Rédaction des statuts avec les associés",
            "Dépôt du capital social dans une banque",
            "Publication d’une annonce légale de création",
            "Dépôt du dossier au greffe compétent",
            "Obtention de l'extrait Kbis après immatriculation"
          ]
        }
    
      
    }

    setCompanyData(companyTypes[type] || null)
  }, [type])

  if (!companyData) {
    return (
      <div className="app">
        <Header />
        <div className="container">
          <div className="company-detail-not-found">
            <h2>Type d'entreprise non trouvé</h2>
            <Link to="/" className="back-link">Retour à l'accueil</Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <main>
        <div className="company-detail-hero">
          <div className="container">
            <div className="company-detail-hero-content">
              <h1 className="company-detail-title">
                <span className="highlight-purple">{companyData.title} - </span>
                <span className="highlight-purple1">{companyData.fullTitle}</span>
              </h1>
              <div className="company-detail-underline"></div>
              <p className="company-detail-subtitle">
                Tout ce que vous devez savoir pour créer votre {companyData.title}
              </p>
            </div>
          </div>
        </div>

        <section className="company-detail-section">
          <div className="container">
            <div className="company-detail-grid">
              <div className="company-detail-image">
                <img src={companyData.image} alt={companyData.title} />
              </div>
              <div className="company-detail-description">
                <h2 className="detail-section-title">Qu'est-ce qu'une {companyData.title} ?</h2>
                <p>{companyData.description}</p>
                <div className="contact-action">
                  <Link to="/" state={{ scrollTo: "contact-section" }} className="detail-contact-button">
                    Être accompagné pour créer votre {companyData.title}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="company-detail-advantages">
          <div className="container">
            <div className="detail-two-columns">
              <div className="detail-column">
                <h2 className="detail-section-title">Avantages de la {companyData.title}</h2>
                <ul className="detail-list">
                  {companyData.advantages.map((advantage, index) => (
                    <li key={`advantage-${index}`}>{advantage}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-column">
                <h2 className="detail-section-title">Inconvénients de la {companyData.title}</h2>
                <ul className="detail-list">
                  {companyData.disadvantages.map((disadvantage, index) => (
                    <li key={`disadvantage-${index}`}>{disadvantage}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="company-detail-steps">
          <div className="container">
            <h2 className="detail-section-title text-center">
              <span className="highlight-purple">Comment créer une </span>
              <span className="highlight-purple1">{companyData.title} ?</span>
            </h2>
            <div className="detail-steps-grid">
              {companyData.steps.map((step, index) => (
                <div key={`step-${index}`} className="detail-step-card">
                  <div className="detail-step-number">{index + 1}</div>
                  <div className="detail-step-content">
                    <p>{step}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="detail-actions">
          
              <Link to="/" state={{ scrollTo: "contact-section" }} className="detail-contact-button">
                Nous contacter pour plus d'informations
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default CompanyTypeDetail