"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../styles/creation-entreprise.css"
import { CheckCircle, Upload, ChevronRight, ChevronLeft, AlertTriangle, Check, Building } from "lucide-react"

const CreationEntreprise = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: choix type, 2: formulaires par document, 3: confirmation, 4: upload
  const [currentDocIndex, setCurrentDocIndex] = useState(0) // Index du document actuel
  const [entrepriseTypes, setEntrepriseTypes] = useState([])
  const [selectedType, setSelectedType] = useState("")
  const [documents, setDocuments] = useState([]) // Documents du template
  const [formValues, setFormValues] = useState({}) // Toutes les valeurs combinées
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [templateInfo, setTemplateInfo] = useState(null)
  const [existingEntreprises, setExistingEntreprises] = useState([])

  // Récupérer les types d'entreprise disponibles et les entreprises existantes
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/templates/types", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setEntrepriseTypes(response.data)
      } catch (err) {
        setError("Erreur lors du chargement des types d'entreprise")
      }
    }

    // Vérifier si l'utilisateur a déjà des entreprises (mais ne pas bloquer la création)
    const checkExistingEntreprises = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/entreprises/me", {
          headers: { Authorization: `Bearer ${token}` },
        })

        // Convertir en tableau si c'est un objet unique
        const entreprises = Array.isArray(response.data) ? response.data : [response.data]

        // Stocker les entreprises existantes
        if (entreprises.length > 0) {
          console.log("Entreprises existantes:", entreprises)
          setExistingEntreprises(entreprises)
        }

        // Continuer avec le chargement des types d'entreprise
        fetchTypes()
      } catch (err) {
        // Pas d'entreprise existante ou erreur, continuer normalement
        fetchTypes()
      }
    }

    checkExistingEntreprises()
  }, [])

  // Récupérer les documents et leurs variables quand un type est sélectionné
  useEffect(() => {
    if (selectedType) {
      const fetchTemplateData = async () => {
        try {
          const token = localStorage.getItem("token")
          // Récupérer les informations du template
          const templateResponse = await axios.get(`http://localhost:8000/templates/by-type/${selectedType}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          setTemplateInfo(templateResponse.data)

          // Récupérer les documents et leurs variables
          const documents = templateResponse.data.documents || []
          setDocuments(documents)

          // Initialiser les valeurs du formulaire pour tous les documents
          const initialValues = {}
          documents.forEach((doc) => {
            if (doc.variables) {
              doc.variables.forEach((variable) => {
                initialValues[variable.nom] = variable.valeur_defaut || ""
              })
            }
          })

          setFormValues(initialValues)
          setCurrentDocIndex(0) // Commencer par le premier document
          setStep(2) // Passer à l'étape du formulaire
        } catch (err) {
          setError("Erreur lors du chargement des informations du template")
          console.error(err)
        }
      }

      fetchTemplateData()
    }
  }, [selectedType])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormValues({
      ...formValues,
      [name]: value,
    })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  // Navigation entre les formulaires des documents
  const handleNextDocument = () => {
    // Valider les champs obligatoires du document actuel
    const currentDoc = documents[currentDocIndex]
    const requiredFields = currentDoc.variables.filter((v) => v.obligatoire).map((v) => v.nom)

    const missingFields = requiredFields.filter((field) => !formValues[field])
    if (missingFields.length > 0) {
      setError(`Veuillez remplir tous les champs obligatoires: ${missingFields.join(", ")}`)
      return
    }

    if (currentDocIndex < documents.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1)
    } else {
      // Si c'est le dernier document, passer à l'étape suivante
      setStep(3) // Confirmation
    }

    setError("") // Effacer les erreurs précédentes
  }

  const handlePreviousDocument = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex(currentDocIndex - 1)
    } else {
      // Si c'est le premier document, revenir à l'étape précédente
      setStep(1) // Sélection du type
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Créer l'objet FormData
      const formData = new FormData()

      // Ajouter le fichier avec le nom correct attendu par l'API
      formData.append("piece_identite", file)

      // Ajouter les données d'entreprise individuellement comme champs formData
      formData.append("nom", formValues.nom_entreprise || "Nouvelle Entreprise")
      formData.append("type", selectedType)
      formData.append("siret", formValues.siret || "")
      formData.append("adresse", formValues.adresse || "")
      formData.append("capital", Number.parseFloat(formValues.capital || 0))
      formData.append("description", formValues.description || "")
      formData.append("template_id", selectedType)
      formData.append("valeurs_variables", JSON.stringify(formValues))

      console.log("Envoi des données:", {
        nom: formValues.nom_entreprise || "Nouvelle Entreprise",
        type: selectedType,
        siret: formValues.siret || "",
        adresse: formValues.adresse || "",
        capital: Number.parseFloat(formValues.capital || 0),
        description: formValues.description || "",
        template_id: selectedType,
        valeurs_variables: formValues,
      })

      const response = await axios.post("http://localhost:8000/entreprises/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setSuccess("Votre entreprise a été créée avec succès ! Vérification du statut...")

      // Vérifier périodiquement si l'entreprise est bien enregistrée
      const createdEntrepriseId = response.data.id
      let attempts = 0
      const maxAttempts = 5

      const verifyCreation = async () => {
        if (attempts >= maxAttempts) {
          setSuccess(
            "Votre entreprise a été créée avec succès ! Vous pouvez suivre son statut dans la section 'Mes démarches'.",
          )
          setTimeout(() => {
            navigate("/client/demarches")
          }, 2000)
          return
        }

        attempts++
        const entrepriseStatus = await checkCreationStatus(createdEntrepriseId)

        if (entrepriseStatus) {
          setSuccess("Votre entreprise a été créée avec succès ! Redirection vers vos démarches...")
          setTimeout(() => {
            navigate("/client/demarches")
          }, 1000)
        } else {
          // Réessayer après un délai
          setTimeout(verifyCreation, 1000)
        }
      }

      // Démarrer la vérification
      verifyCreation()
    } catch (err) {
      console.error("Erreur lors de la soumission:", err)

      // Gérer l'erreur de façon plus détaillée
      if (err.response?.data) {
        const errorData = err.response.data
        if (Array.isArray(errorData)) {
          // Si c'est un tableau d'erreurs, prendre le premier message
          setError(errorData[0]?.msg || JSON.stringify(errorData))
        } else if (typeof errorData === "object") {
          // Si c'est un objet d'erreur
          setError(errorData.detail || JSON.stringify(errorData))
        } else {
          // Fallback pour tout autre format
          setError(String(errorData))
        }
      } else {
        setError("Erreur lors de la création de l'entreprise")
      }
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour vérifier si l'entreprise a été créée avec succès
  const checkCreationStatus = async (entrepriseId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:8000/entreprises/${entrepriseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("Statut de création vérifié:", response.data)
      return response.data
    } catch (err) {
      console.error("Erreur lors de la vérification du statut:", err)
      return null
    }
  }

  // Obtenir le document actuel et ses variables
  const getCurrentDocument = () => {
    if (!documents || documents.length === 0 || currentDocIndex >= documents.length) {
      return { titre: "Document inconnu", variables: [] }
    }
    return documents[currentDocIndex]
  }

  return (
    <div className="creation-entreprise-container8">
      <h1 className="creation-title8">Création d'entreprise</h1>

      

      <div className="creation-steps8">
        <div className={`creation-step8 ${step === 1 ? "active8" : ""} ${step > 1 ? "completed8" : ""}`}>
          <div className="step-number8">{step > 1 ? <Check size={20} /> : 1}</div>
          <div className="step-label8">Type d'entreprise</div>
        </div>
        <div className="step-connector8"></div>
        <div className={`creation-step8 ${step === 2 ? "active8" : ""} ${step > 2 ? "completed8" : ""}`}>
          <div className="step-number8">{step > 2 ? <Check size={20} /> : 2}</div>
          <div className="step-label8">Informations</div>
        </div>
        <div className="step-connector8"></div>
        <div className={`creation-step8 ${step === 3 ? "active8" : ""} ${step > 3 ? "completed8" : ""}`}>
          <div className="step-number8">{step > 3 ? <Check size={20} /> : 3}</div>
          <div className="step-label8">Confirmation</div>
        </div>
        <div className="step-connector8"></div>
        <div className={`creation-step8 ${step === 4 ? "active8" : ""}`}>
          <div className="step-number8">4</div>
          <div className="step-label8">Documents</div>
        </div>
      </div>

      {error && (
        <div className="error-message8">
          <AlertTriangle size={24} />
          {typeof error === "object" ? JSON.stringify(error) : error}
        </div>
      )}
      {success && (
        <div className="success-message8">
          <CheckCircle size={24} />
          {success}
        </div>
      )}

      {step === 1 && (
        <div className="type-selection8">
          <h2>Créer mon entreprise</h2>
          <p>Veuillez sélectionner le type d'entreprise que vous souhaitez créer :</p>

          <div className="type-options8">
            {entrepriseTypes.map((type) => (
              <div
                key={type}
                className={`type-card8 ${selectedType === type ? "selected8" : ""}`}
                onClick={() => setSelectedType(type)}
              >
                <h3>
                  <Building size={20} className="icon-inline" /> {type}
                </h3>
                <p>
                  Description du type {type}. Sélectionnez ce type d'entreprise pour créer une structure adaptée à vos
                  besoins.
                </p>
                <div className="type-card-footer8">
                  <span className="type-select-text8">{selectedType === type ? "Sélectionné" : "Sélectionner"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="form-step8">
          <h2>
            Document {currentDocIndex + 1}/{documents.length}: {getCurrentDocument().titre}
          </h2>
          <div className="progress-bar8">
            <div className="progress8" style={{ width: `${((currentDocIndex + 1) / documents.length) * 100}%` }}></div>
          </div>

          <form>
            {getCurrentDocument().variables &&
              getCurrentDocument().variables.map((variable) => (
                <div key={variable.nom} className="form-group8">
                  <label>
                    {variable.nom}
                    {variable.obligatoire && <span className="required8">*</span>}
                  </label>

                  {variable.type === "select" ? (
                    <select
                      name={variable.nom}
                      value={formValues[variable.nom] || ""}
                      onChange={handleInputChange}
                      required={variable.obligatoire}
                    >
                      <option value="">Sélectionnez une option</option>
                      {(variable.valeur_defaut && typeof variable.valeur_defaut === "string"
                        ? JSON.parse(variable.valeur_defaut || "[]")
                        : []
                      ).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : variable.type === "boolean" ? (
                    <input
                      type="checkbox"
                      name={variable.nom}
                      checked={formValues[variable.nom] === "true"}
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: variable.nom,
                            value: e.target.checked ? "true" : "false",
                          },
                        })
                      }
                    />
                  ) : (
                    <input
                      type={
                        variable.type === "number"
                          ? "number"
                          : variable.type === "date"
                            ? "date"
                            : variable.type === "email"
                              ? "email"
                              : "text"
                      }
                      name={variable.nom}
                      value={formValues[variable.nom] || ""}
                      onChange={handleInputChange}
                      required={variable.obligatoire}
                    />
                  )}

                  {variable.description && <p className="variable-description8">{variable.description}</p>}
                </div>
              ))}

            <div className="form-actions8">
              <button type="button" className="secondary-button8" onClick={handlePreviousDocument}>
                <ChevronLeft size={18} />
                {currentDocIndex === 0 ? "Retour à la sélection" : "Document précédent"}
              </button>
              <button type="button" className="primary-button8" onClick={handleNextDocument}>
                {currentDocIndex < documents.length - 1 ? "Document suivant" : "Continuer vers confirmation"}
                <ChevronRight size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="confirmation-step8">
          <h2>Confirmation des informations</h2>
          <p>Veuillez vérifier les informations ci-dessous avant de soumettre votre demande :</p>

          <div className="confirmation-details8">
            <h3>Type d'entreprise : {selectedType}</h3>

            {documents.map((doc, index) => (
              <div key={index} className="document-section8">
                <h4>{doc.titre}</h4>
                <div className="details-grid8">
                  {doc.variables &&
                    doc.variables.map((variable) => (
                      <div key={variable.nom} className="detail-item8">
                        <strong>{variable.nom} :</strong>
                        <span>{formValues[variable.nom] || ""}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions8">
            <button type="button" className="secondary-button8" onClick={() => setStep(2)}>
              <ChevronLeft size={18} />
              Modifier
            </button>
            <button type="button" className="primary-button8" onClick={() => setStep(4)}>
              Confirmer
              <CheckCircle size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="upload-step8">
          <h2>Pièce d'identité</h2>
          <p>Pour finaliser la création de votre entreprise, veuillez uploader une copie de votre pièce d'identité :</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group8">
              <label>Pièce d'identité (PDF ou image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required />
            </div>

            <div className="form-actions8">
              <button type="button" className="secondary-button8" onClick={() => setStep(3)}>
                <ChevronLeft size={18} />
                Retour
              </button>
              <button type="submit" className="primary-button8" disabled={loading || !file}>
                {loading ? (
                  <>
                    <span className="loading-spinner8"></span>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Soumettre
                    <Upload size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CreationEntreprise
