"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Building2,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Calendar,
  User,
} from "lucide-react"
import "../entreprise-table.css"

const ControleEntrepriseV5 = ({ entreprises: initialEntreprises, fetchEntreprises, setSuccessMsg, setErrorMsg }) => {
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [comments, setComments] = useState("")
  const [entreprises, setEntreprises] = useState(initialEntreprises || [])
  const [allEntreprises, setAllEntreprises] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Récupérer toutes les entreprises au chargement du composant
  useEffect(() => {
    fetchAllEntreprises()
  }, [])

  // Mettre à jour les entreprises lorsque les props changent
  useEffect(() => {
    setEntreprises(initialEntreprises || [])
  }, [initialEntreprises])

  // Récupérer toutes les entreprises, pas seulement celles en attente
  const fetchAllEntreprises = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        setLoadError("Vous devez être connecté pour accéder aux entreprises")
        setIsLoading(false)
        return
      }

      // Essayer d'abord avec le endpoint /all
      try {
        const response = await axios.get("http://localhost:8000/entreprises/all", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAllEntreprises(response.data)
        setIsLoading(false)
      } catch (err) {
        // Si le endpoint /all n'existe pas, essayer avec le endpoint standard
        console.log("Endpoint /all non disponible, utilisation du endpoint standard")
        const response = await axios.get("http://localhost:8000/entreprises/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAllEntreprises(response.data)
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err)
      setLoadError("Erreur lors du chargement des entreprises. Veuillez réessayer.")
      setIsLoading(false)
    }
  }

  const handleSelectEntreprise = async (entrepriseId) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:8000/entreprises/${entrepriseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedEntreprise(response.data)
      setIsLoading(false)
    } catch (err) {
      console.error("Erreur lors de la récupération de l'entreprise:", err)
      setErrorMsg(["Erreur lors du chargement des détails de l'entreprise"])
      setIsLoading(false)
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
      await fetchAllEntreprises()
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
      await fetchAllEntreprises()
      setSelectedEntreprise(null)
    } catch (err) {
      console.error("Erreur lors du rejet:", err)
      setErrorMsg(["Erreur lors du rejet de l'entreprise"])
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "en_attente":
        return "En attente"
      case "validé":
        return "Validé"
      case "rejeté":
        return "Rejeté"
      default:
        return "Inconnu"
    }
  }

  // Filtrer les variables en fonction du terme de recherche
  const getFilteredVariables = (variables) => {
    if (!searchTerm || !variables) return variables

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filteredEntries = Object.entries(variables).filter(([key, value]) => {
      return key.toLowerCase().includes(lowerSearchTerm) || String(value).toLowerCase().includes(lowerSearchTerm)
    })

    return Object.fromEntries(filteredEntries)
  }

  return (
    <div className="v5-entreprises-container">
      {selectedEntreprise ? (
        <div className="v5-entreprise-detail">
          <div className="v5-entreprise-detail-header">
            <h2>{selectedEntreprise.nom}</h2>
            <button className="v5-back-btn" onClick={() => setSelectedEntreprise(null)}>
              Retour
            </button>
          </div>

          <div className="v5-comparison-grid">
            <div className="v5-comparison-column">
              <h3>
                <FileText size={18} />
                Informations soumises
              </h3>
              <div className="v5-info-item">
                <strong>Type:</strong> {selectedEntreprise.type}
              </div>
              <div className="v5-info-item">
                <strong>Date de création:</strong>{" "}
                {new Date(selectedEntreprise.date_creation).toLocaleDateString("fr-FR")}
              </div>
              <div className="v5-info-item">
                <strong>Statut:</strong>{" "}
                <span className={`v5-entreprise-status v5-${selectedEntreprise.statut || "en_attente"}`}>
                  {getStatusLabel(selectedEntreprise.statut || "en_attente")}
                </span>
              </div>

              <h3>
                <Calendar size={18} />
                Variables du document
              </h3>

              {selectedEntreprise.valeurs_variables && Object.keys(selectedEntreprise.valeurs_variables).length > 0 ? (
                <div className="v5-variables-section">
                  <div className="v5-variables-header">
                    <div className="v5-variables-search">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Rechercher une variable..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <span className="v5-variables-count">
                      {Object.keys(selectedEntreprise.valeurs_variables).length} variables
                    </span>
                  </div>

                  <div className="v5-variables-list">
                    {Object.entries(getFilteredVariables(selectedEntreprise.valeurs_variables)).map(
                      ([key, value], index) => (
                        <div key={index} className="v5-variable-item">
                          <span className="v5-variable-name">{key}</span>
                          <span className="v5-variable-value">{value}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <p>Aucune variable disponible</p>
              )}
            </div>

            <div className="v5-comparison-column">
              <h3>
                <User size={18} />
                Pièce d'identité
              </h3>
              {selectedEntreprise.piece_identite ? (
                <div className="v5-id-card-container">
                  <img
                    src={`data:image/jpeg;base64,${selectedEntreprise.piece_identite.content}`}
                    alt="Pièce d'identité"
                    className="v5-id-card-image"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=300&width=400"
                      console.log("Erreur de chargement de l'image")
                    }}
                  />
                  <div className="v5-id-card-info">
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

          <div className="v5-validation-section">
            <h3>Validation</h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajoutez vos commentaires ici..."
              rows={4}
              className="v5-comments-textarea"
            />

            <div className="v5-validation-actions">
              <button
                className="v5-validate-btn"
                onClick={() => handleValidateEntreprise(selectedEntreprise.id)}
                disabled={selectedEntreprise.statut !== "en_attente"}
              >
                <CheckCircle size={16} className="v5-action-icon" />
                Valider
              </button>
              <button
                className="v5-reject-btn"
                onClick={() => handleRejectEntreprise(selectedEntreprise.id)}
                disabled={!comments || selectedEntreprise.statut !== "en_attente"}
              >
                <XCircle size={16} className="v5-action-icon" />
                Rejeter
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="v5-entreprises-header">
            <h2 className="v5-entreprises-title">
              <Building2 size={24} />
              Entreprises
            </h2>
            <button className="v5-refresh-btn" onClick={fetchAllEntreprises} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? "v5-spin" : ""} />
              Actualiser
            </button>
          </div>

          {loadError && (
            <div className="v5-error-banner">
              <AlertCircle size={20} />
              <span>{loadError}</span>
              <button className="v5-retry-btn" onClick={fetchAllEntreprises}>
                Réessayer
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="v5-loading-state">
              <div className="v5-spinner"></div>
              <p>Chargement des entreprises...</p>
            </div>
          ) : allEntreprises.length === 0 && !loadError ? (
            <div className="v5-empty-state">
              <Building2 size={48} className="v5-empty-icon" />
              <p>Aucune entreprise trouvée</p>
              <button className="v5-retry-btn" onClick={fetchAllEntreprises}>
                Actualiser
              </button>
            </div>
          ) : (
            <table className="v5-entreprises-table">
              <thead>
                <tr>
                  <th className="v5-type-cell" style={{ width: "25%" }}>
                    Type
                  </th>
                  <th className="v5-date-cell" style={{ width: "25%" }}>
                    Date de création
                  </th>
                  <th className="v5-status-cell" style={{ width: "25%" }}>
                    Statut
                  </th>
                  <th className="v5-actions-cell" style={{ width: "25%" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {allEntreprises.map((entreprise) => (
                  <tr key={entreprise.id}>
                    <td>{entreprise.type}</td>
                    <td>{new Date(entreprise.date_creation).toLocaleDateString("fr-FR")}</td>
                    <td className="v5-status-cell">
                      <span className={`v5-entreprise-status v5-${entreprise.statut || "en_attente"}`}>
                        {getStatusLabel(entreprise.statut || "en_attente")}
                      </span>
                    </td>
                    <td className="v5-actions-cell">
                      <button
                        className="v5-entreprise-action-btn"
                        onClick={() => handleSelectEntreprise(entreprise.id)}
                      >
                        <Eye size={16} className="v5-action-icon" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default ControleEntrepriseV5
