import { Link } from "react-router-dom"
import { FileText, CheckCircle } from "lucide-react"

const Dashboard = () => {
  return (
    <div className="dashboard-container8">
      <div className="welcome-section8">
        <h1 className="welcome-title8">
          Bienvenue <span className="wave-emoji8">👋</span> !
        </h1>
        <p className="welcome-description8">
          On va vous guider pas à pas pour concrétiser votre projet entrepreneurial.
        </p>
      </div>

      <div className="checklist-section8">
        <h2 className="checklist-title8">Checklist du créateur : l'essentiel pour réussir</h2>

        <div className="progress-bar-container8">
          <div className="progress-bar8">
            <div className="progress-fill8" style={{ width: "29%" }}></div>
          </div>
          <span className="progress-percentage8">29%</span>
        </div>

        <div className="checklist-items8">
          <div className="checklist-item8">
            <div className="checklist-icon8 pdf-icon8">
              <FileText size={24} />
            </div>
            <span className="checklist-text8 completed8">
              Je découvre les infos essentielles à savoir avant de créer
            </span>
          </div>

          <div className="checklist-item8">
            <div className="checklist-icon8 tool-icon8">
              <CheckCircle size={24} />
            </div>
            <span className="checklist-text8">Je vérifie quelle forme juridique est la plus adaptée à mon projet</span>
          </div>

          <div className="checklist-item8">
            <div className="checklist-icon8 document-icon8">
              <FileText size={24} />
            </div>
            <span className="checklist-text8">Je prépare les documents nécessaires à la création</span>
          </div>
        </div>
      </div>

      <div className="quick-actions8" style={{ marginTop: "50px" }}>
        <h2>Actions rapides</h2>
        <div className="action-buttons8">
          <Link to="/client/creation" className="action-button8">
            Créer une entreprise
          </Link>
          <Link to="/client/demarches" className="action-button8">
            Commencer une démarche
          </Link>
          <Link to="/client/support" className="action-button8">
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
