"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import "../styles.css"

// Structure de données pour la recherche
const searchData = [
  {
    title: "Création d'entreprise",
    keywords: ["création", "entreprise", "créer", "lancer", "démarrer", "startup", "société"],
    path: "/#services-section",
    description: "Découvrez comment créer votre entreprise rapidement et simplement",
    category: "Services",
  },
  {
    title: "SARL - Société à responsabilité limitée",
    keywords: ["sarl", "société", "responsabilité", "limitée", "création", "entreprise"],
    path: "/#pro-section",
    description: "Tout savoir sur la SARL et ses avantages pour votre projet",
    category: "Types d'entreprise",
  },
  {
    title: "SAS - Société par actions simplifiée",
    keywords: ["sas", "société", "actions", "simplifiée", "création", "entreprise"],
    path: "/#pro-section",
    description: "Les spécificités de la SAS pour votre entreprise",
    category: "Types d'entreprise",
  },
  {
    title: "SASU - Société par actions simplifiée unipersonnelle",
    keywords: ["sasu", "société", "actions", "simplifiée", "unipersonnelle", "création", "entreprise"],
    path: "/#pro-section",
    description: "Créez votre SASU en toute simplicité",
    category: "Types d'entreprise",
  },
  {
    title: "Modification d'entreprise",
    keywords: ["modification", "entreprise", "changer", "évoluer", "transformer"],
    path: "/#services-section",
    description: "Services de modification pour votre entreprise existante",
    category: "Services",
  },
  {
    title: "Contactez-nous",
    keywords: ["contact", "joindre", "message", "email", "téléphone", "question"],
    path: "/#contact-section",
    description: "Notre équipe est à votre disposition pour répondre à vos questions",
    category: "Contact",
  },
  {
    title: "FAQ - Questions fréquentes",
    keywords: ["faq", "questions", "fréquentes", "aide", "réponses"],
    path: "/#faq-section",
    description: "Réponses aux questions les plus fréquemment posées",
    category: "Aide",
  },
  {
    title: "Nos services juridiques",
    keywords: ["services", "juridique", "droit", "légal", "accompagnement"],
    path: "/#services-section",
    description: "Découvrez notre gamme complète de services juridiques",
    category: "Services",
  },
  {
    title: "Espace professionnel",
    keywords: ["pro", "professionnel", "espace", "expert", "partenaire"],
    path: "/#pro-section",
    description: "Accédez à notre espace dédié aux professionnels",
    category: "Espace Pro",
  },
  {
    title: "Avantages MiaCorp",
    keywords: ["avantages", "bénéfices", "pourquoi", "choisir", "simplicité", "rapidité", "fiabilité"],
    path: "/#advantages-section",
    description: "Pourquoi choisir MiaCorp pour vos démarches juridiques",
    category: "À propos",
  },
]

const SearchModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const searchInputRef = useRef(null)
  const navigate = useNavigate()

  // Focus sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus()
      }, 100)
    }
  }, [isOpen])

  // Réinitialiser l'état à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setSearchResults([])
      setSelectedResultIndex(-1)
    }
  }, [isOpen])

  // Fonction de recherche
  const handleSearch = (term) => {
    setSearchTerm(term)

    if (!term.trim()) {
      setSearchResults([])
      return
    }

    const normalizedTerm = term.toLowerCase().trim()

    // Recherche dans les données
    const results = searchData.filter((item) => {
      // Recherche dans le titre
      if (item.title.toLowerCase().includes(normalizedTerm)) {
        return true
      }

      // Recherche dans les mots-clés
      return item.keywords.some((keyword) => keyword.toLowerCase().includes(normalizedTerm))
    })

    setSearchResults(results)
    setSelectedResultIndex(-1)
  }

  // Navigation vers le résultat sélectionné
  const navigateToResult = (result) => {
    onClose()

    // Extraire le chemin et l'ID de section si présent
    const [path, hash] = result.path.split("#")

    if (hash) {
      // Navigation vers une section de la page d'accueil
      navigate("/", { state: { scrollTo: hash } })
    } else {
      // Navigation vers une autre page
      navigate(result.path)
    }
  }

  // Gestion des touches du clavier
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedResultIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter" && selectedResultIndex >= 0) {
      navigateToResult(searchResults[selectedResultIndex])
    }
  }

  // Grouper les résultats par catégorie
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {})

  if (!isOpen) return null

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <div className="search-input-container">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Search size={20} className="search-icon" />
           
          </div>
          <button className="close-search-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="search-results-container">
          {searchTerm && searchResults.length === 0 ? (
            <div className="no-results">
              <p>Aucun résultat trouvé pour "{searchTerm}"</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([category, results]) => (
              <div key={category} className="search-results-category">
                <h3 className="search-category-title">{category}</h3>
                <ul className="search-results-list">
                  {results.map((result, index) => {
                    const resultIndex = searchResults.indexOf(result)
                    return (
                      <li
                        key={result.title}
                        className={`search-result-item ${selectedResultIndex === resultIndex ? "selected" : ""}`}
                        onClick={() => navigateToResult(result)}
                        onMouseEnter={() => setSelectedResultIndex(resultIndex)}
                      >
                        <h4 className="search-result-title">{result.title}</h4>
                        <p className="search-result-description">{result.description}</p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}

          {searchTerm && searchResults.length > 0 && (
            <div className="search-tips">
             
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal
