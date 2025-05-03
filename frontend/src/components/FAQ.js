"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import "../styles.css"

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0)

  const faqItems = [
    {
      question: "Comment fonctionne le processus de création d'entreprise avec MiaCorp ?",
      answer: (
        <>
          <p>
            Grâce à notre technologie innovante de génération documentaire et de transmission des formalités, MiaCorp
            vous permet de réaliser vos démarches rapidement et efficacement, grâce à un parcours digitalisé, simple et
            intuitif.
          </p>
          <p className="mt-4">
            Notre plateforme vous guide étape par étape, depuis le choix de la forme juridique jusqu'au dépôt de votre
            dossier auprès des organismes compétents, en passant par la rédaction de vos statuts personnalisés.
          </p>
        </>
      ),
    },
    {
      question: "Qu'est-ce qui différencie MiaCorp de ses concurrents ?",
      answer: (
        <>
          <p>
            MiaCorp se distingue par son approche centrée sur l'utilisateur, combinant technologie de pointe et
            expertise juridique. Notre plateforme offre :
          </p>
          <ul className="faq-list">
            <li>Un accompagnement personnalisé par des juristes diplômés</li>
            <li>Des documents 100% conformes à la législation en vigueur</li>
            <li>Une interface intuitive qui simplifie les démarches complexes</li>
            <li>Un suivi en temps réel de l'avancement de votre dossier</li>
            <li>Des délais de traitement optimisés</li>
          </ul>
        </>
      ),
    },
    {
      question: "Puis-je utiliser MiaCorp si je ne connais rien au droit ou à l'entrepreneuriat ?",
      answer: (
        <>
          <p>
            Absolument ! MiaCorp a été conçu spécifiquement pour rendre accessibles les démarches juridiques aux
            entrepreneurs, même sans connaissances préalables en droit.
          </p>
          <p className="mt-4">
            Notre interface vous guide pas à pas avec des explications claires et des formulaires simplifiés. En cas de
            besoin, notre équipe de juristes est disponible pour répondre à vos questions et vous accompagner tout au
            long du processus.
          </p>
        </>
      ),
    },
    {
      question:
        "Mon projet est unique et ma situation particulière est très spécifique. MiaCorp peut-il me correspondre ?",
      answer: (
        <>
          <p>
            MiaCorp s'adapte à une grande variété de projets et de situations. Notre système permet une personnalisation
            poussée des documents juridiques en fonction de vos besoins spécifiques.
          </p>
          <p className="mt-4">
            Pour les cas très particuliers, nos juristes experts peuvent intervenir pour adapter les solutions
            proposées. Si votre situation nécessite une expertise encore plus pointue, nous pourrons vous orienter vers
            l'un de nos partenaires spécialisés.
          </p>
        </>
      ),
    },
    
  ]

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  return (
    <section  id="faq-section" className="faq-section">
      <div className="container">
        <h2 className="faq-title">
          <span className="highlight-purple">Questions</span> fréquentes
        </h2>

        <div className="faq-container">
          {faqItems.map((item, index) => (
            <div key={index} className={`faq-item ${openIndex === index ? "faq-item-open" : ""}`}>
              <button
                className="faq-question"
                onClick={() => toggleQuestion(index)}
                aria-expanded={openIndex === index}
              >
                {item.question}
                <span className="faq-icon">
                  {openIndex === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </span>
              </button>

              {openIndex === index && <div className="faq-answer">{item.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
