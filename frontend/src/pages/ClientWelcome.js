"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "./ClientWelcome.css"
import { generatePreview } from "../services/PreviewService.js"

const ClientWelcome = () => {
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
        valeurs_variables: formValues
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

   // Fonction pour prévisualiser le document
const handlePreview = async () => {
  try {
    setIsPreviewLoading(true);
    setError("");
    
    // Cas où l'utilisateur a déjà une entreprise existante
    if (step === 5 && entreprise) {
      const token = localStorage.getItem("token");
      
      // 1. D'abord, essayez d'utiliser les informations du template si elles sont disponibles
      if (templateInfo && templateInfo.google_doc_id) {
        console.log("Utilisation du templateInfo pour la prévisualisation:", templateInfo);
        
        // Extraction de l'ID Google Doc
        let googleDocId = templateInfo.google_doc_id;
        
        // Si c'est une URL complète, extraire l'ID
        if (googleDocId.includes('/')) {
          if (googleDocId.includes('/d/')) {
            googleDocId = googleDocId.split('/d/')[1].split('/')[0];
          } else {
            // Essayer de récupérer le dernier segment comme ID potentiel
            const segments = googleDocId.split('/');
            googleDocId = segments[segments.length - 1];
          }
        }
        
        // Ouvrir le document dans une nouvelle fenêtre
        window.open(`https://docs.google.com/document/d/${googleDocId}/edit`, "_blank");
        return;
      } 
      // 2. Sinon, essayez avec l'ID du template associé à l'entreprise
      else if (entreprise.template_id) {
        console.log("Génération de la prévisualisation avec l'ID du template:", entreprise.template_id);
        
        // Assurez-vous que les valeurs de variables sont un objet et non une chaîne JSON
        const valeurs = typeof entreprise.valeurs_variables === 'string' 
          ? JSON.parse(entreprise.valeurs_variables) 
          : entreprise.valeurs_variables;
          
        // Appel au service de prévisualisation
        const result = await generatePreview(entreprise.template_id, valeurs);
        console.log("Résultat de la prévisualisation:", result);
        
        if (result && result.google_doc_id) {
          let googleDocId = result.google_doc_id;
          
          if (googleDocId.includes('/d/')) {
            googleDocId = googleDocId.split('/d/')[1].split('/')[0];
          }
          
          window.open(`https://docs.google.com/document/d/${googleDocId}/edit`, "_blank");
          return;
        }
      }
      
      // Si on arrive ici, c'est qu'aucune méthode n'a fonctionné
      setError("Impossible de générer la prévisualisation: aucun modèle de document associé à l'entreprise.");
    } 
    // Cas où l'utilisateur est à l'étape de confirmation avant création de l'entreprise
    else if (step === 3 && selectedType) {
      console.log("Génération de prévisualisation avant création avec type:", selectedType);
      console.log("Valeurs de formulaire:", formValues);
      
      const result = await generatePreview(selectedType, formValues);
      console.log("Résultat de la prévisualisation:", result);
      
      if (result && result.google_doc_id) {
        let googleDocId = result.google_doc_id;
        
        if (googleDocId.includes('/d/')) {
          googleDocId = googleDocId.split('/d/')[1].split('/')[0];
        }
        
        window.open(`https://docs.google.com/document/d/${googleDocId}/edit`, "_blank");
        return;
      } else {
        setError("Impossible de générer la prévisualisation: " + (result?.error || "erreur inconnue"));
      }
    } else {
      setError("Impossible de prévisualiser à cette étape. Veuillez compléter les étapes précédentes.");
    }
  } catch (err) {
    console.error("Erreur lors de la prévisualisation:", err);
    setError("Erreur lors de la prévisualisation du document: " + (err.message || err.toString()));
  } finally {
    setIsPreviewLoading(false);
  }
}

  return (
    <div className="client-welcome-container">
      <h1>Bienvenue dans votre espace client</h1>

      {error && <div className="error-message">{typeof error === "object" ? JSON.stringify(error) : error}</div>}
      {success && <div className="success-message">{success}</div>}

      {step === 1 && (
        <div className="type-selection">
          <h2>Créer mon entreprise</h2>
          <p>Veuillez sélectionner le type d'entreprise que vous souhaitez créer :</p>

          <div className="type-options">
            {entrepriseTypes.map((type) => (
              <div
                key={type}
                className={`type-card2 ${selectedType === type ? "selected" : ""}`}
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
        <div className="form-step">
          <h2>Formulaire pour {selectedType}</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setStep(3)
            }}
          >
            {templateVariables.map((variable) => (
              <div key={variable.nom} className="form-group">
                <label>
                  {variable.nom}
                  {variable.obligatoire && <span className="required">*</span>}
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

                {variable.description && <p className="variable-description">{variable.description}</p>}
              </div>
            ))}

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="submit" className="primary-button">
                Continuer
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="confirmation-step">
          <h2>Confirmation des informations</h2>
          <p>Veuillez vérifier les informations ci-dessous avant de soumettre votre demande :</p>

          <div className="confirmation-details">
            <h3>Type d'entreprise : {selectedType}</h3>

            <div className="details-grid">
              {Object.entries(formValues).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <strong>{key} :</strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* À intégrer dans votre JSX, remplaçant le bouton de prévisualisation existant */}
<div className="preview-section">
  <h3>Prévisualisation du document</h3>
  <button
    className="preview-button"
    onClick={handlePreview}
    disabled={isPreviewLoading}
  >
    {isPreviewLoading ? (
      <>
        <span className="loading-spinner"></span>
        Génération en cours...
      </>
    ) : (
      "Prévisualiser"
    )}
  </button>
  {error && (
    <div className="preview-error">
      <p>{error}</p>
      <p className="preview-debug-tip">
        Conseil: Assurez-vous que le template est associé à un document Google Docs valide
        et que toutes les variables ont été correctement définies.
      </p>
    </div>
  )}
</div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(2)}>
              Modifier
            </button>
            <button type="button" className="primary-button" onClick={() => setStep(4)}>
              Confirmer
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="upload-step">
          <h2>Pièce d'identité</h2>
          <p>Pour finaliser la création de votre entreprise, veuillez uploader une copie de votre pièce d'identité :</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pièce d'identité (PDF ou image)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required />
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setStep(3)}>
                Retour
              </button>
              <button type="submit" className="primary-button" disabled={loading || !file}>
                {loading ? "Envoi en cours..." : "Soumettre"}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 5 && entreprise && (
        <div className="status-step">
          <h2>Statut de votre entreprise</h2>

          <div className={`status-badge ${entreprise.statut}`}>
            {entreprise.statut === "en_attente" ? "En attente" : entreprise.statut === "validé" ? "Validé" : "Rejeté"}
          </div>

          {entreprise.statut === "en_attente" && (
            <p>
              Votre demande est en cours d'analyse par nos experts. Vous recevrez une notification dès qu'une décision
              sera prise (délai maximum 24h).
            </p>
          )}

          {entreprise.statut === "validé" && (
            <div className="download-section">
              <p>Votre entreprise a été validée ! Vous pouvez maintenant télécharger vos documents :</p>
              <button className="download-button">Télécharger le document final</button>
            </div>
          )}

          {entreprise.statut === "rejeté" && (
            <div className="rejection-section">
              <p>Votre demande a été rejetée pour la raison suivante :</p>
              <div className="rejection-comment">{entreprise.commentaires || "Aucun commentaire fourni."}</div>
              <button
                className="modify-button"
                onClick={() => {
                  setSelectedType(entreprise.type)
                  setStep(2) // Retour au formulaire avec les anciennes valeurs
                }}
              >
                Modifier ma demande
              </button>
            </div>
          )}

          <div className="preview-section">
            <h3>Prévisualisation du document</h3>
            <button
              className="preview-button"
              onClick={handlePreview}
              disabled={isPreviewLoading}
            >
              {isPreviewLoading ? "Génération en cours..." : "Prévisualiser"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientWelcome