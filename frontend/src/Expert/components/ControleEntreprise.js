"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const ControleEntreprise = ({ entreprises, fetchEntreprises, setSuccessMsg, setErrorMsg }) => {
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [comments, setComments] = useState("")

  // Reset selectedEntreprise when component unmounts
  useEffect(() => {
    return () => {
      setSelectedEntreprise(null)
    }
  }, [])

  const handleSelectEntreprise = async (entrepriseId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:8000/entreprises/${entrepriseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedEntreprise(response.data)
    } catch (err) {
      console.error("Erreur lors de la récupération de l'entreprise:", err)
      setErrorMsg(["Erreur lors du chargement des détails de l'entreprise"])
    }
  }

  const handleValidateEntreprise = async (entrepriseId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/entreprises/${entrepriseId}/validate`,
        { commentaires: comments },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setSuccessMsg("Entreprise validée avec succès !")
      setComments("")
      await fetchEntreprises()
      setSelectedEntreprise(null)
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
      setErrorMsg(["Erreur lors de la validation de l'entreprise"])
    }
  }

  const handleRejectEntreprise = async (entrepriseId) => {
    if (!comments) {
      setErrorMsg(["Veuillez ajouter un commentaire expliquant le rejet"])
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/entreprises/${entrepriseId}/reject`,
        { commentaires: comments },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setSuccessMsg("Entreprise rejetée avec succès !")
      setComments("")
      await fetchEntreprises()
      setSelectedEntreprise(null)
    } catch (err) {
      console.error("Erreur lors du rejet:", err)
      setErrorMsg(["Erreur lors du rejet de l'entreprise"])
    }
  }

  return (
    <div className="entreprises-container">
      <h2>Entreprises en attente de validation</h2>

      {entreprises.length === 0 ? (
        <p>Aucune entreprise en attente de validation</p>
      ) : (
        <div className="entreprises-list">
          {entreprises.map((entreprise) => (
            <div key={entreprise.id} className="entreprise-card" onClick={() => handleSelectEntreprise(entreprise.id)}>
              <h3>{entreprise.nom}</h3>
              <p>Type: {entreprise.type}</p>
              <p>Créée le: {new Date(entreprise.date_creation).toLocaleDateString("fr-FR")}</p>
              <span className="status-badge en_attente">En attente</span>
            </div>
          ))}
        </div>
      )}

      {selectedEntreprise && (
        <div className="entreprise-detail">
          <div className="detail-header">
            <h2>{selectedEntreprise.nom}</h2>
            <button className="back-btn" onClick={() => setSelectedEntreprise(null)}>
              Retour
            </button>
          </div>

          <div className="comparison-grid">
            <div className="comparison-column">
              <h3>Informations soumises</h3>
              <div className="info-item">
                <strong>Type:</strong> {selectedEntreprise.type}
              </div>

              {/* Ajoutez cette section pour afficher les variables */}
              <h3>Variables du document</h3>
              {selectedEntreprise.valeurs_variables && (
                <div className="variables-list">
                  {Object.entries(selectedEntreprise.valeurs_variables).map(([key, value], index) => (
                    <div key={index} className="variable-item">
                      <span className="variable-name">{key}</span>
                      <span className="variable-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="comparison-column">
              <h3>Pièce d'identité</h3>
              {selectedEntreprise.piece_identite ? (
                <div className="id-card-container">
                  <img
                    src={`data:image/jpeg;base64,${selectedEntreprise.piece_identite.content}`}
                    alt="Pièce d'identité"
                    className="id-card-image"
                  />
                  <div className="id-card-info">
                    <p>
                      Date d'upload:{" "}
                      {new Date(selectedEntreprise.piece_identite.date_upload).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ) : (
                <p>Pièce d'identité non disponible</p>
              )}
            </div>
          </div>

          <div className="validation-section">
            <h3>Validation</h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajoutez vos commentaires ici..."
              rows={4}
              className="comments-textarea"
            />

            <div className="validation-actions">
              <button className="validate-btn" onClick={() => handleValidateEntreprise(selectedEntreprise.id)}>
                Valider
              </button>
              <button
                className="reject-btn"
                onClick={() => handleRejectEntreprise(selectedEntreprise.id)}
                disabled={!comments}
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControleEntreprise
