import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styleInfo.css";
import { useNavigate } from "react-router-dom";

const faqData = [
  {
    title: "Qu'est-ce qu'une SARL ?",
    content:
      "La SARL (Société à Responsabilité Limitée) est une forme juridique idéale pour les PME. Elle permet de limiter la responsabilité des associés à leurs apports."
  },
  {
    title: "Qu'est-ce qu'une SASU ?",
    content:
      "La SASU (Société par Actions Simplifiée Unipersonnelle) est conçue pour les entrepreneurs individuels. Elle permet une gestion souple et une protection du patrimoine."
  },
  {
    title: "Qu'est-ce qu'une SAS ?",
    content:
      "La SAS (Société par Actions Simplifiée) convient aux projets collaboratifs et innovants. Elle offre une grande flexibilité statutaire."
  }
];

const BusinessCreationInfo = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate();

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleLearnMore = (type) => {
    navigate(`/company-type/${type}`);
  };

  return (
    <div className="app2">
      <Header />
      <main>
        <section className="faq-section2">
          <div className="container faq-container2">
            {faqData.map((item, index) => (
              <div
                key={index}
                className={`faq-item ${openIndex === index ? "faq-item-open" : ""}`}
              >
                <button className="faq-question2" onClick={() => toggleAccordion(index)}>
                  {item.title}
                  <span className="faq-icon2">{openIndex === index ? "−" : "+"}</span>
                </button>
                {openIndex === index && (
                  <div className="faq-answer2">{item.content}</div>
                )}
              </div>
            ))}
          </div>
        </section>

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

               {/* Nouvelle carte pour EURL */}
          <div className="type-card">
            <div className="type-image">
              <img src="/images/imggggg.png" alt="EURL" className="type-img" />
            </div>
            <h3 className="type-heading">EURL</h3>
            <p className="type-text">
              Entreprise Unipersonnelle à Responsabilité Limitée, variante de la SARL avec un seul associé. Idéale pour
              l'entrepreneur individuel souhaitant limiter sa responsabilité.
            </p>
            <div className="type-button-container">
              <button className="type-button" onClick={() => handleLearnMore("eurl")}>
                En savoir plus sur l'EURL
              </button>
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

export default BusinessCreationInfo;
