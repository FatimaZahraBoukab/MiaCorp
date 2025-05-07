import { MoreVertical } from "lucide-react"

const MesDemarches = () => {
  return (
    <div className="demarches-container8">
      <div className="demarches-header8">
        <h1>Toutes mes démarches</h1>
        <button className="commencer-button8">Commencer une démarche</button>
      </div>

      <p className="demarches-intro8">À vous de jouer ! Complétez vos questionnaires dans vos démarches</p>

      <h2 className="section-title8">Vos démarches débutées récemment (1)</h2>

      <div className="demarche-card8">
        <div className="demarche-info8">
          <span className="demarche-type8">Modification d'entreprise</span>
          <span className="demarche-number8">n° de dossier : 13019696</span>
        </div>
        <div className="demarche-actions8">
          <span className="demarche-date8">Mise à jour le : 02/04/2025</span>
          <button className="consulter-button8">Consulter</button>
          <button className="more-button8">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <h2 className="section-title8">Nos recommandations</h2>

      <div className="recommendations-grid8">
        <div className="recommendation-card8">
          <div className="recommendation-icon8">
            <img src="/placeholder.svg?height=40&width=40" alt="Compte courant" />
          </div>
          <div className="recommendation-content8">
            <h3>Compte courant d'associé</h3>
            <p>Financez simplement l'activité de votre société</p>
            <button className="en-savoir-plus8">En savoir plus</button>
          </div>
        </div>

        <div className="recommendation-card8">
          <div className="recommendation-icon8">
            <img src="/placeholder.svg?height=40&width=40" alt="Dépôt de marque" />
          </div>
          <div className="recommendation-content8">
            <h3>Dépôt de marque</h3>
            <p>Protégez votre nom et votre logo</p>
            <button className="en-savoir-plus8">En savoir plus</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MesDemarches
