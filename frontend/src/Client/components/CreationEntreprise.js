"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const CreationEntreprise = () => {
  const [step, setStep] = useState(1) // 1: choix type, 2: formulaire, 3: confirmation, 4: upload, 5: statut
  const [entrepriseTypes, setEntrepriseTypes] = useState([])
  const [selectedType, setSelectedType] = useState("")
  const [templateVariables, setTemplateVariables] = useState([])
  const [formValues, setFormValues] = useState({})
  const [entreprise, setEntreprise] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [templateInfo, setTemplateInfo] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState("pdf")

  // Récupérer les types d'entreprise disponibles
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

    // Vérifier si l'utilisateur a déjà une entreprise
    const checkExistingEntreprise = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/entreprises/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setEntreprise(response.data)
        setStep(5) // Aller directement à l'étape de statut

        // Récupérer les informations du template associé à l'entreprise
        if (response.data.template_id) {
          try {
            const templateResponse = await axios.get(`http://localhost:8000/templates/${response.data.template_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            setTemplateInfo(templateResponse.data)
          } catch (templateErr) {
            console.error("Erreur lors de la récupération du template:", templateErr)
          }
        }
      } catch (err) {
        // Pas d'entreprise existante, continuer normalement
        fetchTypes()
      }
    }

    checkExistingEntreprise()
  }, [])

  // Récupérer les variables du template quand un type est sélectionné
  useEffect(() => {
    if (selectedType) {
      const fetchVariables = async () => {
        try {
          const token = localStorage.getItem("token")
          const response = await axios.get(`http://localhost:8000/templates/${selectedType}/variables`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setTemplateVariables(response.data)

          // Initialiser les valeurs du formulaire
          const initialValues = {}
          response.data.forEach((variable) => {
            initialValues[variable.nom] = variable.valeur_defaut || ""
          })
          setFormValues(initialValues)

          // Récupérer les informations du template
          try {
            const templateResponse = await axios.get(`http://localhost:8000/templates/${selectedType}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            setTemplateInfo(templateResponse.data)
          } catch (templateErr) {
            console.error("Erreur lors de la récupération du template:", templateErr)
          }

          setStep(2) // Passer à l'étape du formulaire
        } catch (err) {
          setError("Erreur lors du chargement des variables du template")
        }
      }

      fetchVariables()
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
      // Important: 'valeurs_variables' doit être envoyé comme JSON string
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

      setEntreprise(response.data)
      setSuccess("Votre entreprise a été créée avec succès !")
      setStep(5) // Aller à l'étape de statut
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

  // Fonction pour télécharger le document
  const handleDownloadDocument = async (format) => {
    setIsDownloading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/documents/export/${entreprise.id}?format=${format}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erreur détaillée:", errorData)
        throw new Error(errorData.detail || "Erreur lors du téléchargement du document")
      }

      // Récupérer le blob du document
      const blob = await response.blob()

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob)

      // Créer un lien temporaire pour télécharger le fichier
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url

      // Déterminer le nom du fichier en fonction du format
      const extension = format === "pdf" ? "pdf" : "docx"
      a.download = `document_entreprise.${extension}`

      // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(`Document téléchargé avec succès au format ${format.toUpperCase()}`)
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err)
      setError(err.message || "Erreur lors du téléchargement du document")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="creation-entreprise-container8">
      <h1>Création d'entreprise</h1>

      {error && <div className="error-message8">{typeof error === "object" ? JSON.stringify(error) : error}</div>}
      {success && <div className="success-message8">{success}</div>}

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
                <h3>{type}</h3>
                <p>Description du type {type}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="form-step8">
          <h2>Formulaire pour {selectedType}</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setStep(3)
            }}
          >
            {templateVariables.map((variable) => (
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
                    {JSON.parse(variable.valeur_defaut || "[]").map((opt) => (
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
              <button type="button" className="secondary-button8" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="submit" className="primary-button8">
                Continuer
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

            <div className="details-grid8">
              {Object.entries(formValues).map(([key, value]) => (
                <div key={key} className="detail-item8">
                  <strong>{key} :</strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions8">
            <button type="button" className="secondary-button8" onClick={() => setStep(2)}>
              Modifier
            </button>
            <button type="button" className="primary-button8" onClick={() => setStep(4)}>
              Confirmer
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
                Retour
              </button>
              <button type="submit" className="primary-button8" disabled={loading || !file}>
                {loading ? "Envoi en cours..." : "Soumettre"}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 5 && entreprise && (
        <div className="status-step8">
          <h2>Statut de votre entreprise</h2>

          <div className={`status-badge8 ${entreprise.statut}8`}>
            {entreprise.statut === "en_attente" ? "En attente" : entreprise.statut === "validé" ? "Validé" : "Rejeté"}
          </div>

          {entreprise.statut === "en_attente" && (
            <p>
              Votre demande est en cours d'analyse par nos experts. Vous recevrez une notification dès qu'une décision
              sera prise (délai maximum 24h).
            </p>
          )}

          {entreprise.statut === "validé" && (
            <div className="download-section8">
              <p>Votre entreprise a été validée ! Vous pouvez maintenant télécharger vos documents :</p>

              <div className="format-selection8">
                <h3>Choisissez un format :</h3>
                <div className="format-options8">
                  <label className="format-option8">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={downloadFormat === "pdf"}
                      onChange={() => setDownloadFormat("pdf")}
                    />
                    <span>PDF</span>
                  </label>
                  <label className="format-option8">
                    <input
                      type="radio"
                      name="format"
                      value="docx"
                      checked={downloadFormat === "docx"}
                      onChange={() => setDownloadFormat("docx")}
                    />
                    <span>Word (DOCX)</span>
                  </label>
                </div>
              </div>

              <button
                className="download-button8"
                onClick={() => handleDownloadDocument(downloadFormat)}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <span className="loading-spinner8"></span>
                    Téléchargement en cours...
                  </>
                ) : (
                  `Télécharger le document final (${downloadFormat.toUpperCase()})`
                )}
              </button>
            </div>
          )}

          {entreprise.statut === "rejeté" && (
            <div className="rejection-section8">
              <p>Votre demande a été rejetée pour la raison suivante :</p>
              <div className="rejection-comment8">{entreprise.commentaires || "Aucun commentaire fourni."}</div>
              <button
                className="modify-button8"
                onClick={() => {
                  setSelectedType(entreprise.type)
                  setStep(2) // Retour au formulaire avec les anciennes valeurs
                }}
              >
                Modifier ma demande
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CreationEntreprise
