import "../styles.css"

const BusinessStages = () => {
  return (
    <section className="business-stages">
      <div className="container">
        <h2 className="stages-title">
        Toujours à vos côtés pour simplifier votre <span className="highlight-purple1">gestion juridique.</span>
        </h2>

        <div className="stages-grid">
          <div className="stage-card">
            <div className="stage-image">
            <img src="/images/img1.jpg" alt="Création d'entreprise" />
            </div>
            <h3 className="stage-heading">Création d'entreprise</h3>
            <p className="stage-text">
            Plus besoin de passer des heures : créez, adaptez et téléchargez vos documents juridiques en toute autonomie.
            </p>
            <div className="stage-button-container">
              <button className="stage-button">En savoir plus</button>
            </div>
          </div>

          <div className="stage-card">
            <div className="stage-image">
              <img src="/images/img2.jpg" alt="Modification d'entreprise" />
            </div>
            <h3 className="stage-heading">Modification d'entreprise</h3>
            <p className="stage-text">
            Un changement à déclarer ou un document à modifier ? Gérez toutes vos formalités juridiques en quelques clics, en toute sécurité.
            </p>
            <div className="stage-button-container">
              <button className="stage-button">En savoir plus</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BusinessStages
