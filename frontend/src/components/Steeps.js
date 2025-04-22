import ServiceCard from "./SteepsCard"
import "../styles.css"

// Icônes SVG personnalisées
const ListIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="6" r="1.5" fill="white" />
    <rect x="7" y="5" width="14" height="2" rx="1" fill="white" />
    <circle cx="4" cy="12" r="1.5" fill="white" />
    <rect x="7" y="11" width="14" height="2" rx="1" fill="white" />
    <circle cx="4" cy="18" r="1.5" fill="white" />
    <rect x="7" y="17" width="14" height="2" rx="1" fill="white" />
  </svg>
)

const GearIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.2 3C10.9463 3 10.7239 3.17736 10.6729 3.42608L10.2603 5.60199C9.47437 5.84653 8.74697 6.21789 8.10497 6.69454L6.07463 5.78417C5.84149 5.67731 5.56717 5.74434 5.41421 5.94721L3.94721 7.94721C3.79434 8.15008 3.82739 8.43127 4.02417 8.59463L5.69454 9.89503C5.56045 10.4353 5.5 10.9987 5.5 11.5714C5.5 12.1442 5.56045 12.7076 5.69454 13.2478L4.02417 14.5483C3.82739 14.7116 3.79434 14.9928 3.94721 15.1957L5.41421 17.1957C5.56717 17.3985 5.84149 17.4656 6.07463 17.3587L8.10497 16.4483C8.74697 16.925 9.47437 17.2964 10.2603 17.5409L10.6729 19.7168C10.7239 19.9655 10.9463 20.1429 11.2 20.1429H13.8C14.0537 20.1429 14.2761 19.9655 14.3271 19.7168L14.7397 17.5409C15.5256 17.2964 16.253 16.925 16.895 16.4483L18.9254 17.3587C19.1585 17.4656 19.4328 17.3985 19.5858 17.1957L21.0528 15.1957C21.2057 14.9928 21.1726 14.7116 20.9758 14.5483L19.3055 13.2478C19.4395 12.7076 19.5 12.1442 19.5 11.5714C19.5 10.9987 19.4395 10.4353 19.3055 9.89503L20.9758 8.59463C21.1726 8.43127 21.2057 8.15008 21.0528 7.94721L19.5858 5.94721C19.4328 5.74434 19.1585 5.67731 18.9254 5.78417L16.895 6.69454C16.253 6.21789 15.5256 5.84653 14.7397 5.60199L14.3271 3.42608C14.2761 3.17736 14.0537 3 13.8 3H11.2Z"
      fill="white"
    />
  </svg>
)

const EmailIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="3" fill="white" />
    <path
      d="M2 7L10.2 13.65C11.2667 14.45 12.7333 14.45 13.8 13.65L22 7"
      stroke=" #1a3263"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Steeps = () => {
  return (
    <section className="services">
      <div className="container">
        <div className="services-grid">
          <ServiceCard
            icon={
              <div className="icon-circle">
                <ListIcon />
              </div>
            }
            title="Personnalisation"
            description="Faites vos choix en vous laissant guider au travers de nos formulaires."
            showArrow={true}
          />
          <ServiceCard
            icon={
              <div className="icon-circle">
                <GearIcon />
              </div>
            }
            title="Création"
            description={
              <>
                Nous préparons <span className="highlight-blue">immédiatement</span> vos documents 100% personnalisés.
              </>
            }
            showArrow={true}
          />
          <ServiceCard
            icon={
              <div className="icon-circle">
                <EmailIcon />
              </div>
            }
        
            title="Téléchargement"
            description="Recevez votre dossier par email prêt à imprimer en PDF ou Word."
            showArrow={false}
          />
        </div>
      </div>
    </section>
  )
}

export default Steeps
