"use client"

import { Mail, Phone, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const Support = () => {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null)
    } else {
      setOpenFaq(index)
    }
  }

  const handleEmailClick = () => {
    window.open("mailto:support@miacorp.com", "_blank")
  }

  const handlePhoneClick = () => {
    window.location.href = "tel:+33611955823"
  }

  const faqs = [
    {
      question: "Comment créer une entreprise ?",
      answer:
        "Pour créer une entreprise, rendez-vous dans la section \"Création d'entreprise\" et suivez les étapes indiquées. Vous devrez choisir le type d'entreprise, remplir les informations nécessaires, et soumettre les documents requis. Notre équipe validera votre demande dans un délai de 24h.",
    },
    {
      question: "Comment modifier mon entreprise ?",
      answer:
        "Pour modifier votre entreprise, accédez à la section \"Modification d'entreprise\" et sélectionnez l'entreprise à modifier. Vous pourrez alors mettre à jour les informations comme l'adresse, le capital social ou les associés. Les modifications seront soumises à validation.",
    },
    {
      question: "Comment suivre mes démarches ?",
      answer:
        'Vous pouvez suivre l\'avancement de vos démarches dans la section "Mes démarches". Chaque démarche affiche son statut actuel et les prochaines étapes à compléter.',
    },
    {
      question: "Quels documents sont nécessaires pour créer une entreprise ?",
      answer:
        "Les documents nécessaires varient selon le type d'entreprise, mais généralement vous aurez besoin d'une pièce d'identité, d'un justificatif de domicile, des statuts signés, et d'une attestation de dépôt de capital. Notre système vous guidera pour chaque document requis pendant le processus de création.",
    },
    {
      question: "Combien de temps prend la création d'une entreprise ?",
      answer:
        "Le processus complet de création d'entreprise prend généralement entre 5 et 10 jours ouvrés. Cela inclut la validation de votre dossier par notre équipe (24h), le traitement par le greffe (3-7 jours) et la réception de votre Kbis (1-2 jours). Vous pouvez suivre chaque étape dans votre espace client.",
    },
    {
      question: "Comment puis-je obtenir de l'aide pour remplir mes documents ?",
      answer:
        "Vous pouvez obtenir de l'aide de plusieurs façons : consulter nos guides détaillés dans la section Support, nous contacter par email ou téléphone aux coordonnées indiquées ci-dessus, ou planifier un rendez-vous avec l'un de nos experts juridiques qui vous accompagnera pas à pas.",
    },
  ]

  return (
    <div className="support-container8">
      <div className="support-header8">
        <h1>Support et assistance</h1>
        <p className="support-intro8">
          Besoin d'aide ? Notre équipe d'experts est disponible pour vous accompagner dans toutes vos démarches.
        </p>
      </div>

      <div className="support-contact-cards8">
        <div className="support-contact-card8">
          <div className="support-contact-icon8">
            <Mail size={32} />
          </div>
          <div className="support-contact-content8">
            <h2>Nous contacter par email</h2>
            <p>miacorps.tanger@gmail.com</p>
            <button className="support-contact-button8" onClick={handleEmailClick}>
              Envoyer un email
            </button>
          </div>
        </div>

        <div className="support-contact-card8">
          <div className="support-contact-icon8">
            <Phone size={32} />
          </div>
          <div className="support-contact-content8">
            <h2>Nous appeler</h2>
            <p>Du lundi au vendredi, de 9h à 18h</p>
            
            <button className="support-contact-button8" >
            06 11 95 58 23
            </button>
          </div>
        </div>
      </div>

      <div className="faq-section8">
        <h2 className="faq-title8">Questions fréquentes</h2>

        <div className="faq-list8">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item8 ${openFaq === index ? "faq-open8" : ""}`}>
              <div className="faq-question8" onClick={() => toggleFaq(index)}>
                <h3>{faq.question}</h3>
                {openFaq === index ? <ChevronUp className="faq-icon8" /> : <ChevronDown className="faq-icon8" />}
              </div>
              <div className={`faq-answer8 ${openFaq === index ? "faq-answer-visible8" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Support
