import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const BusinessCreation = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate("/login");
  };

  const handleLearnMoreClick = () => {
    navigate("/business-creation-info");
  };

  return (
    <div className="app">
      <Header />
      <main>
        <section className="business-creation-page1">
          <div className="container1">
            <h1 className="stages-title1" style={{ textAlign: "center", marginTop: "100px", marginBottom: "40px" }}>
              Créez l'entreprise faite <span className="highlight-purple">pour vous</span>
            </h1>
            <p className="text-center" style={{ marginBottom: "40px", fontSize: "1.2rem" }}>
              Confiez vos démarches au <strong>n°1</strong> du marché : zéro stress, rapide et économique
            </p>

            <div className="types-grid1" >
              <div className="type-card1">
                <div >
                  <div >
                    <img src="/images/pret.png" alt="Créer mon entreprise" />
                  </div>
                  <h3 className="type-heading1">
                    Je suis prêt(e) à créer mon entreprise
                  </h3>
                  <p className="type-text1">
                    SASU, SAS, SARL...
                  </p>
                  <div className="type-button-container1">
                    <button className="type-button1" onClick={handleStartClick}>
                      C'est parti !
                    </button>
                  </div>
                </div>
              </div>

              <div className="type-card1">
                <div >
                  <div >
                    <img src="/images/info.png" alt="Recherche d'informations" />
                  </div>
                  <h3 className="type-heading1">
                    Je suis à la recherche d'informations
                  </h3>
                  <p className="type-text1">
                    Comparateur de formes juridiques, statuts...
                  </p>
                  <div className="type-button-container1">
                    <button className="type-button1" onClick={handleLearnMoreClick}>
                      En savoir plus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessCreation;