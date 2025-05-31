"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import DynamicShareholderForm from "./DynamicShareholderForm"
import { CheckCircle, Upload, ChevronRight, ChevronLeft, AlertTriangle, Check, Building } from "lucide-react"
import "../styles/creation-entreprise.css"

const CreationEntrepriseUpdated = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [currentDocIndex, setCurrentDocIndex] = useState(0)
  const [entrepriseTypes, setEntrepriseTypes] = useState([])
  const [selectedType, setSelectedType] = useState("")
  const [documents, setDocuments] = useState([])
  const [formValues, setFormValues] = useState({})
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [templateInfo, setTemplateInfo] = useState(null)
  const [showShareholderForm, setShowShareholderForm] = useState(false)

  const formRef = useRef(null)

  // Récupérer les types d'entreprise disponibles (SEULEMENT SARL et SAS)
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/templates/types", {
          headers: { Authorization: `Bearer ${token}` },
        })
        // Supprimer le filtrage - garder tous les types
        setEntrepriseTypes(response.data)
      } catch (err) {
        setError("Erreur lors du chargement des types d'entreprise")
      }
    }
    fetchTypes()
  }, [])

  // Récupérer les documents et leurs variables quand un type est sélectionné
  useEffect(() => {
    if (selectedType) {
      const fetchTemplateData = async () => {
        try {
          const token = localStorage.getItem("token")
          const templateResponse = await axios.get(`http://localhost:8000/templates/by-type/${selectedType}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          setTemplateInfo(templateResponse.data)
          const documents = templateResponse.data.documents || []
          setDocuments(documents)

          // Initialiser les valeurs du formulaire
          const initialValues = {}
          documents.forEach((doc) => {
            if (doc.variables) {
              doc.variables.forEach((variable) => {
                initialValues[variable.nom] = variable.valeur_defaut || ""
              })
            }
          })

          setFormValues(initialValues)
          setCurrentDocIndex(0)
          setStep(2)
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

  const hasShareholderVariables = () => {
    const currentDoc = getCurrentDocument()
    if (!currentDoc.variables) return false

    return currentDoc.variables.some(
      (variable) =>
        (variable.nom.includes("nom_associe") ||
          variable.nom.includes("date_naissance_associe") ||
          variable.nom.includes("apport_numeraire_associe") ||
          variable.nom.includes("nombre_actions_associe") ||
          variable.nom.includes("nombre_parts_associe")) &&
        !variable.nom.includes("#LOOP_") &&
        !variable.nom.includes("/LOOP_"),
    )
  }

  const handleNextDocument = () => {
    const currentDoc = documents[currentDocIndex]

    // CORRECTION: Validation des champs obligatoires (exclure les marqueurs de boucles)
    const visibleVariables = currentDoc.variables.filter((variable) => {
      // Exclure les marqueurs de boucles et conditions
      if (
        variable.nom.includes("#LOOP_") ||
        variable.nom.includes("/LOOP_") ||
        variable.nom.includes("#IF_") ||
        variable.nom.includes("/IF_")
      )
        return false

      // Exclure les variables générées automatiquement
      if (
        [
          "nombre_actionnaires",
          "liste_actionnaires",
          "total_apports_numeraire",
          "nombre_total_parts",
          "nombre_total_actions",
        ].includes(variable.nom)
      )
        return false

      // Exclure les variables d'associés individuelles si on a le formulaire dynamique
      if (
        (selectedType === "SARL" || selectedType === "SAS") &&
        hasShareholderVariables() &&
        (variable.nom.includes("_associe") || variable.nom.includes("actionnaire"))
      )
        return false

      return true
    })

    const requiredFields = visibleVariables.filter((v) => v.obligatoire).map((v) => v.nom)
    const missingFields = requiredFields.filter((field) => !formValues[field])

    if (missingFields.length > 0) {
      setError(`Veuillez remplir tous les champs obligatoires: ${missingFields.join(", ")}`)
      return
    }

    // Si c'est un document avec des actionnaires et qu'on n'a pas encore montré le formulaire
    // Modifier cette condition pour inclure tous les types qui supportent les actionnaires multiples
    if (hasShareholderVariables() && !showShareholderForm && (selectedType === "SARL" || selectedType === "SAS")) {
      setShowShareholderForm(true)
      return
    }

    // Passer au document suivant ou à la confirmation
    if (currentDocIndex < documents.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1)
      setShowShareholderForm(false)
    } else {
      setStep(3)
    }

    setError("")
  }

  const handlePreviousDocument = () => {
    if (showShareholderForm) {
      setShowShareholderForm(false)
      return
    }

    if (currentDocIndex > 0) {
      setCurrentDocIndex(currentDocIndex - 1)
    } else {
      setStep(1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()

      formData.append("piece_identite", file)
      formData.append("nom", formValues.denomination_sociale || "Nouvelle Entreprise")
      formData.append("type", selectedType)
      formData.append("siret", formValues.siret || "")
      formData.append("adresse", formValues.adresse_siege_social || "")
      formData.append("capital", Number.parseFloat(formValues.capital_social || 0))
      formData.append("description", formValues.objet_social || "")
      formData.append("template_id", templateInfo.id)
      formData.append("valeurs_variables", JSON.stringify(formValues))

      const response = await axios.post("http://localhost:8000/entreprises/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setSuccess("Votre entreprise a été créée avec succès !")
      setTimeout(() => {
        navigate("/client/demarches")
      }, 2000)
    } catch (err) {
      console.error("Erreur lors de la soumission:", err)
      setError("Erreur lors de la création de l'entreprise")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentDocument = () => {
    if (!documents || documents.length === 0 || currentDocIndex >= documents.length) {
      return { titre: "Document inconnu", variables: [] }
    }
    return documents[currentDocIndex]
  }

  const getInputType = (variable) => {
    if (variable.type) {
      switch (variable.type.toLowerCase()) {
        case "date":
          return "date"
        case "datetime":
          return "datetime-local"
        case "number":
          return "number"
        case "email":
          return "email"
        case "tel":
          return "tel"
        case "boolean":
          return "checkbox"
        case "select":
          return "select"
        default:
          return "text"
      }
    }

    const nom = variable.nom.toLowerCase()
    if (nom.includes("date")) return "date"
    if (nom.includes("montant") || nom.includes("capital") || nom.includes("nombre")) return "number"
    if (nom.includes("email")) return "email"
    if (nom.includes("tel")) return "tel"
    return "text"
  }

  const syncShareholderVariables = () => {
    const currentDoc = getCurrentDocument()
    if (!currentDoc.variables) return

    // Récupérer les variables d'associés existantes du formulaire
    const associeVariables = currentDoc.variables.filter(
      (variable) =>
        variable.nom.includes("_associe") &&
        !variable.nom.includes("#LOOP_") &&
        !variable.nom.includes("/LOOP_") &&
        ![
          "nombre_actionnaires",
          "liste_actionnaires",
          "total_apports_numeraire",
          "nombre_total_parts",
          "nombre_total_actions",
        ].includes(variable.nom),
    )

    if (associeVariables.length > 0 && !formValues.liste_actionnaires) {
      // CORRECTION: Créer un actionnaire par défaut avec toutes les variables incluant nombre_actions_associe
      const defaultShareholder = {
        id: 1,
        nom_associe: formValues.nom_associe || "",
        date_naissance_associe: formValues.date_naissance_associe || "",
        lieu_naissance_associe: formValues.lieu_naissance_associe || "",
        adresse_associe: formValues.adresse_associe || "",
        nationalite_associe: formValues.nationalite_associe || "",
        apport_numeraire_associe: formValues.apport_numeraire_associe || "",
        nombre_parts_associe: formValues.nombre_parts_associe || "",
        nombre_actions_associe: formValues.nombre_actions_associe || "", // AJOUT: Variable manquante
      }

      // Mettre à jour formValues avec la liste d'actionnaires
      const updatedFormValues = {
        ...formValues,
        liste_actionnaires: JSON.stringify([defaultShareholder]),
        nombre_actionnaires: "1",
      }

      setFormValues(updatedFormValues)
    }
  }

  // Appeler cette fonction quand on affiche le formulaire d'actionnaires
  useEffect(() => {
    // CORRECTION: Seulement pour les types multi-actionnaires
    if (showShareholderForm && (selectedType === "SARL" || selectedType === "SAS")) {
      syncShareholderVariables()
    }
  }, [showShareholderForm, selectedType])

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
          {error}
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
                  {type === "SARL" && "Société à Responsabilité Limitée - Idéale pour les PME avec des associés"}
                  {type === "SAS" && "Société par Actions Simplifiée - Flexible pour les projets innovants"}
                  {type === "SASU" && "Société par Actions Simplifiée Unipersonnelle - Pour un seul associé"}
                  {type === "EURL" && "Entreprise Unipersonnelle à Responsabilité Limitée - Pour un entrepreneur seul"}
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
          {showShareholderForm ? (
            <div>
              <h2>Actionnaires / Associés</h2>
              <DynamicShareholderForm
                formValues={formValues}
                setFormValues={setFormValues}
                entrepriseType={selectedType}
              />
              <div className="form-actions8">
                <button type="button" className="secondary-button8" onClick={handlePreviousDocument}>
                  <ChevronLeft size={18} />
                  Retour aux informations générales
                </button>
                <button type="button" className="primary-button8" onClick={handleNextDocument}>
                  {currentDocIndex < documents.length - 1 ? "Document suivant" : "Continuer vers confirmation"}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2>
                Document {currentDocIndex + 1}/{documents.length}: {getCurrentDocument().titre}
              </h2>
              <div className="progress-bar8">
                <div
                  className="progress8"
                  style={{ width: `${((currentDocIndex + 1) / documents.length) * 100}%` }}
                ></div>
              </div>

              <form ref={formRef}>
                {getCurrentDocument().variables &&
                  getCurrentDocument()
                    .variables.filter((variable) => {
                      // CORRECTION: Filtrer les marqueurs de boucle et conditions plus strictement
                      if (
                        variable.nom.includes("#LOOP_") ||
                        variable.nom.includes("/LOOP_") ||
                        variable.nom.includes("#IF_") ||
                        variable.nom.includes("/IF_")
                      )
                        return false

                      if (variable.nom.includes("{{#") || variable.nom.includes("{{/")) return false

                      // Filtrer les variables générées automatiquement
                      if (
                        [
                          "nombre_actionnaires",
                          "liste_actionnaires",
                          "total_apports_numeraire",
                          "nombre_total_parts",
                          "nombre_total_actions",
                        ].includes(variable.nom)
                      )
                        return false

                      // Filtrer les variables d'associés individuelles si on a le formulaire dynamique
                      if ((selectedType === "SARL" || selectedType === "SAS") && hasShareholderVariables()) {
                        if (variable.nom.includes("_associe") || variable.nom.includes("actionnaire")) return false
                      }

                      return true
                    })
                    .map((variable) => {
                      const inputType = getInputType(variable)

                      return (
                        <div key={variable.nom} className="form-group8">
                          <label>
                            {variable.nom}
                            {variable.obligatoire && <span className="required8">*</span>}
                          </label>

                          {inputType === "checkbox" ? (
                            <div className="checkbox-container">
                              <input
                                type="checkbox"
                                id={`checkbox-${variable.nom}`}
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
                                className="form-checkbox"
                              />
                              <label htmlFor={`checkbox-${variable.nom}`} className="checkbox-label">
                                {variable.description || ""}
                              </label>
                            </div>
                          ) : inputType === "select" ? (
                            <select
                              name={variable.nom}
                              value={formValues[variable.nom] || ""}
                              onChange={handleInputChange}
                              required={variable.obligatoire}
                              className="form-control"
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
                          ) : (
                            <input
                              type={inputType}
                              name={variable.nom}
                              value={formValues[variable.nom] || ""}
                              onChange={handleInputChange}
                              required={variable.obligatoire}
                              className="form-control"
                            />
                          )}

                          {variable.description && inputType !== "checkbox" && (
                            <p className="variable-description8">{variable.description}</p>
                          )}
                        </div>
                      )
                    })}

                <div className="form-actions8">
                  <button type="button" className="secondary-button8" onClick={handlePreviousDocument}>
                    <ChevronLeft size={18} />
                    {currentDocIndex === 0 ? "Retour à la sélection" : "Document précédent"}
                  </button>
                  <button type="button" className="primary-button8" onClick={handleNextDocument}>
                    {hasShareholderVariables() && (selectedType === "SARL" || selectedType === "SAS")
                      ? "Ajouter les actionnaires"
                      : currentDocIndex < documents.length - 1
                        ? "Document suivant"
                        : "Continuer vers confirmation"}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}
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
                    doc.variables
                      .filter(
                        (variable) =>
                          !variable.nom.includes("#LOOP_") &&
                          !variable.nom.includes("/LOOP_") &&
                          !variable.nom.includes("#IF_") &&
                          !variable.nom.includes("/IF_") &&
                          ![
                            "nombre_actionnaires",
                            "liste_actionnaires",
                            "total_apports_numeraire",
                            "nombre_total_parts",
                            "nombre_total_actions",
                          ].includes(variable.nom),
                      )
                      .map((variable) => (
                        <div key={variable.nom} className="detail-item8">
                          <strong>{variable.nom} :</strong>
                          <span>{formValues[variable.nom] || ""}</span>
                        </div>
                      ))}
                </div>
              </div>
            ))}

            {/* Afficher les actionnaires si présents */}
            {formValues.liste_actionnaires && (
              <div className="document-section8">
                <h4>Actionnaires / Associés</h4>
                <div className="shareholders-confirmation">
                  {JSON.parse(formValues.liste_actionnaires).map((actionnaire, index) => (
                    <div key={index} className="shareholder-confirmation-card">
                      <h5>Actionnaire {index + 1}</h5>
                      <div className="details-grid8">
                        <div className="detail-item8">
                          <strong>Nom :</strong>
                          <span>{actionnaire.nom_associe}</span>
                        </div>
                        <div className="detail-item8">
                          <strong>Apport :</strong>
                          <span>{actionnaire.apport_numeraire_associe} €</span>
                        </div>
                        {selectedType === "SARL" && (
                          <div className="detail-item8">
                            <strong>Parts :</strong>
                            <span>{actionnaire.nombre_parts_associe}</span>
                          </div>
                        )}
                        {selectedType === "SAS" && (
                          <div className="detail-item8">
                            <strong>Actions :</strong>
                            <span>{actionnaire.nombre_actions_associe}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
                className="file-input"
              />
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

export default CreationEntrepriseUpdated
