import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import "../styleInfo.css";

const BusinessModification = () => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleOptionChange = (option) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleContinue = () => {
    navigate("/login");
  };

  const options = [
    "Transfert de siège social",
    "Changement d'activité",
    "Nomination d'un dirigeant",
    "Cession de parts sociales",
    "Changement d'un dirigeant",
    "Autres modifications",
    "Changement du nom"
  ];

  return (
    <div className="app">
      <Header />
      <main>
        <section className="modification-section">
          <div className="modification-container">
            <div className="modification-left">
              <h1 className="modification-title">Modification des <br /> statuts</h1>
              <p className="modification-subtext">
                Grâce à l'accompagnement de nos experts en modification statutaire, modifier vos statuts devient :
              </p>
              <ul className="modification-list">
                <li><strong className="highlight-blue">1. Simple</strong> : un simple questionnaire à remplir en ligne</li>
                <li><strong className="highlight-blue">2. Sûr</strong> : nos juristes vous répondent et vérifient votre dossier</li>
                <li><strong className="highlight-blue">3. Rapide</strong> : en 48h, votre dossier est envoyé au greffe</li>
              </ul>
            </div>

            <div className="modification-right">
              <h3 className="modification-form-title">
                Quelles modifications souhaitez-vous effectuer ?
              </h3>
              <div className="modification-options">
                {options.map((option, index) => (
                  <label key={index} className="modification-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={() => handleOptionChange(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
              <button className="modification-button" onClick={handleContinue}>
                Modifier 
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessModification;