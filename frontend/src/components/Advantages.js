import "../styles.css"

const Advantages = () => {
  return (
    <section className="advantages">
      <div className="container">
        <h2 className="advantages-title">
          Pourquoi les entrepreneurs choisissent <span className="highlight-purple">Mia</span>
          <span className="highlight-purple1">Corp</span>
        </h2>

        <div className="advantages-container">
          <div className="advantages-grid">
            <div className="advantage-item">
              <h3 className="advantage-heading">Simplicité</h3>
              <p className="advantage-text">Centralisez tous vos documents juridiques en quelques clics.</p>
            </div>

            <div className="advantage-item">
              <h3 className="advantage-heading">Rapidité</h3>
              <p className="advantage-text">
                Un simple questionnaire à remplir en ligne. Traitement du dossier en 48h.
              </p>
            </div>

            <div className="advantage-item">
              <h3 className="advantage-heading">Fiabilité</h3>
              <p className="advantage-text">Des traitements sécurisés par nos juristes pour garantir la conformité de vos documents..</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Advantages
