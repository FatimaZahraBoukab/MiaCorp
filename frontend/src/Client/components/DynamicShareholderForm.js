"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Users } from "lucide-react"
import "../styles/dynamic-shareholders.css"

const DynamicShareholderForm = ({ formValues, setFormValues, entrepriseType }) => {
  const [actionnaires, setActionnaires] = useState(() => {
    if (formValues.liste_actionnaires) {
      try {
        return JSON.parse(formValues.liste_actionnaires)
      } catch (e) {
        console.error("Erreur parsing liste_actionnaires:", e)
      }
    }
    return [
      {
        id: 1,
        nom_associe: formValues.nom_associe || "",
        date_naissance_associe: formValues.date_naissance_associe || "",
        lieu_naissance_associe: formValues.lieu_naissance_associe || "",
        adresse_associe: formValues.adresse_associe || "",
        nationalite_associe: formValues.nationalite_associe || "",
        apport_numeraire_associe: formValues.apport_numeraire_associe || "",
        nombre_parts_associe: formValues.nombre_parts_associe || "",
        nombre_actions_associe: formValues.nombre_actions_associe || "",
      },
    ]
  })

  useEffect(() => {
    updateFormValues(actionnaires)
  }, [])

  const ajouterActionnaire = () => {
    const nouvelActionnaire = {
      id: Date.now(),
      nom_associe: "",
      date_naissance_associe: "",
      lieu_naissance_associe: "",
      adresse_associe: "",
      nationalite_associe: "",
      apport_numeraire_associe: "",
      nombre_parts_associe: "",
      nombre_actions_associe: "",
    }

    const nouveauxActionnaires = [...actionnaires, nouvelActionnaire]
    setActionnaires(nouveauxActionnaires)
    updateFormValues(nouveauxActionnaires)
  }

  const supprimerActionnaire = (id) => {
    if (actionnaires.length > 1) {
      const nouveauxActionnaires = actionnaires.filter((a) => a.id !== id)
      setActionnaires(nouveauxActionnaires)
      updateFormValues(nouveauxActionnaires)
    }
  }

  const updateActionnaire = (id, field, value) => {
    const nouveauxActionnaires = actionnaires.map((actionnaire) =>
      actionnaire.id === id ? { ...actionnaire, [field]: value } : actionnaire,
    )
    setActionnaires(nouveauxActionnaires)
    updateFormValues(nouveauxActionnaires)
  }

  const updateFormValues = (actionnairesList) => {
    const newFormValues = { ...formValues }

    // Nettoyer SEULEMENT les variables d'actionnaires individuelles,
    // PAS les marqueurs de boucles et conditions
    Object.keys(newFormValues).forEach((key) => {
      // Ne supprimer que les variables d'actionnaires avec index, pas les marqueurs de boucle
      if ((key.includes("_associe_") && /\d+$/.test(key)) || (key.includes("actionnaire_") && /\d+$/.test(key))) {
        delete newFormValues[key]
      }
    })

    // Ajouter les variables pour chaque actionnaire avec index
    actionnairesList.forEach((actionnaire, index) => {
      Object.keys(actionnaire).forEach((field) => {
        if (field !== "id") {
          // Variable avec index pour les boucles
          newFormValues[`${field}_${index + 1}`] = actionnaire[field]
          // Variable sans index pour le premier actionnaire (compatibilité)
          if (index === 0) {
            newFormValues[field] = actionnaire[field]
          }
        }
      })
    })

    // Variables de synthèse
    newFormValues.nombre_actionnaires = actionnairesList.length.toString()
    newFormValues.liste_actionnaires = JSON.stringify(actionnairesList)

    const totalApports = actionnairesList.reduce((total, actionnaire) => {
      return total + (Number.parseFloat(actionnaire.apport_numeraire_associe) || 0)
    }, 0)
    newFormValues.total_apports_numeraire = totalApports.toString()

    // Calculer séparément les parts et actions
    const totalParts = actionnairesList.reduce((total, actionnaire) => {
      return total + (Number.parseInt(actionnaire.nombre_parts_associe) || 0)
    }, 0)

    const totalActions = actionnairesList.reduce((total, actionnaire) => {
      return total + (Number.parseInt(actionnaire.nombre_actions_associe) || 0)
    }, 0)

    newFormValues.nombre_total_parts = totalParts.toString()
    newFormValues.nombre_total_actions = totalActions.toString()

    setFormValues(newFormValues)
  }

  // Supporter SARL et SAS pour les actionnaires multiples
  // SASU et EURL sont unipersonnelles donc pas besoin du formulaire dynamique
  const supportsMultipleShareholders = entrepriseType === "SARL" || entrepriseType === "SAS"

  return (
    <div className="V4-dynamic-shareholders-container">
      <div className="V4-shareholders-header">
        <h3>
          <Users size={20} />
          {entrepriseType === "SARL" ? "Associés" : "Actionnaires"} ({actionnaires.length})
        </h3>
        <p className="V4-shareholders-description">
          {entrepriseType === "SARL" ? "Gérez les associés de votre SARL" : "Gérez les actionnaires de votre SAS"}
        </p>
      </div>

      {actionnaires.map((actionnaire, index) => (
        <div key={actionnaire.id} className="V4-shareholder-card">
          <div className="V4-shareholder-header">
            <h4>
              {entrepriseType === "SARL" ? "Associé" : "Actionnaire"} {index + 1}
            </h4>
            {actionnaires.length > 1 && (
              <button
                type="button"
                onClick={() => supprimerActionnaire(actionnaire.id)}
                className="V4-delete-shareholder-btn"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="V4-shareholder-form-grid">
            <div className="V4-form-group">
              <label>
                Nom complet <span className="V4-required-indicator">*</span>
              </label>
              <input
                type="text"
                value={actionnaire.nom_associe}
                onChange={(e) => updateActionnaire(actionnaire.id, "nom_associe", e.target.value)}
                placeholder="Ex: M. DUPONT Jean"
                required
                className="V4-form-control"
              />
            </div>

            <div className="V4-form-group">
              <label>
                Date de naissance <span className="V4-required-indicator">*</span>
              </label>
              <input
                type="date"
                value={actionnaire.date_naissance_associe}
                onChange={(e) => updateActionnaire(actionnaire.id, "date_naissance_associe", e.target.value)}
                required
                className="V4-form-control"
              />
            </div>

            <div className="V4-form-group">
              <label>
                Lieu de naissance <span className="V4-required-indicator">*</span>
              </label>
              <input
                type="text"
                value={actionnaire.lieu_naissance_associe}
                onChange={(e) => updateActionnaire(actionnaire.id, "lieu_naissance_associe", e.target.value)}
                placeholder="Ex: Paris, France"
                required
                className="V4-form-control"
              />
            </div>

            <div className="V4-form-group">
              <label>
                Adresse <span className="V4-required-indicator">*</span>
              </label>
              <input
                type="text"
                value={actionnaire.adresse_associe}
                onChange={(e) => updateActionnaire(actionnaire.id, "adresse_associe", e.target.value)}
                placeholder="Ex: 12 rue de la Paix 75001 Paris"
                required
                className="V4-form-control"
              />
            </div>

            <div className="V4-form-group">
              <label>
                Nationalité <span className="V4-required-indicator">*</span>
              </label>
              <input
                type="text"
                value={actionnaire.nationalite_associe}
                onChange={(e) => updateActionnaire(actionnaire.id, "nationalite_associe", e.target.value)}
                placeholder="Ex: Française"
                required
                className="V4-form-control"
              />
            </div>

            <div className="V4-form-group">
              <label>
                Apport en numéraire (€) <span className="V4-required-indicator">*</span>
              </label>
              <input
                type="number"
                value={actionnaire.apport_numeraire_associe}
                onChange={(e) => updateActionnaire(actionnaire.id, "apport_numeraire_associe", e.target.value)}
                placeholder="Ex: 5000"
                min="0"
                step="0.01"
                required
                className="V4-form-control"
              />
            </div>

            {/* Afficher parts OU actions selon le type d'entreprise */}
            {entrepriseType === "SARL" && (
              <div className="V4-form-group">
                <label>
                  Nombre de parts <span className="V4-required-indicator">*</span>
                </label>
                <input
                  type="number"
                  value={actionnaire.nombre_parts_associe}
                  onChange={(e) => updateActionnaire(actionnaire.id, "nombre_parts_associe", e.target.value)}
                  placeholder="Ex: 100"
                  min="1"
                  required
                  className="V4-form-control"
                />
              </div>
            )}

            {entrepriseType === "SAS" && (
              <div className="V4-form-group">
                <label>
                  Nombre d'actions <span className="V4-required-indicator">*</span>
                </label>
                <input
                  type="number"
                  value={actionnaire.nombre_actions_associe}
                  onChange={(e) => updateActionnaire(actionnaire.id, "nombre_actions_associe", e.target.value)}
                  placeholder="Ex: 100"
                  min="1"
                  required
                  className="V4-form-control"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {supportsMultipleShareholders && (
        <button type="button" onClick={ajouterActionnaire} className="V4-add-shareholder-btn">
          <Plus size={18} />
          Ajouter un {entrepriseType === "SARL" ? "associé" : "actionnaire"}
        </button>
      )}

      <div className="V4-shareholders-summary">
        <h4>Résumé</h4>
        <div className="V4-summary-grid">
          <div className="V4-summary-item">
            <span>Nombre total :</span>
            <strong>{actionnaires.length}</strong>
          </div>
          <div className="V4-summary-item">
            <span>Total des apports :</span>
            <strong>
              {actionnaires
                .reduce((total, a) => total + (Number.parseFloat(a.apport_numeraire_associe) || 0), 0)
                .toLocaleString()}{" "}
              €
            </strong>
          </div>
          <div className="V4-summary-item">
            <span>Total des {entrepriseType === "SARL" ? "parts" : "actions"} :</span>
            <strong>
              {entrepriseType === "SARL"
                ? actionnaires.reduce((total, a) => total + (Number.parseInt(a.nombre_parts_associe) || 0), 0)
                : actionnaires.reduce((total, a) => total + (Number.parseInt(a.nombre_actions_associe) || 0), 0)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicShareholderForm
