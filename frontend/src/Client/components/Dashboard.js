"use client"

import { Link, useNavigate } from "react-router-dom"
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Edit,
  Download,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react"
import { useState, useEffect } from "react"
import axios from "axios"

const Dashboard = () => {
  const navigate = useNavigate()
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [stats, setStats] = useState({
    demarches: 0,
    entreprisesValidees: 0,
    entreprisesRejetees: 0,
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entrepriseToDelete, setEntrepriseToDelete] = useState(null)

  // Récupérer les entreprises de l'utilisateur
  useEffect(() => {
    fetchEntreprises()
  }, [])

  const fetchEntreprises = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Vous n'êtes pas connecté. Veuillez vous connecter.")
        setLoading(false)
        return
      }

      // Ajouter un paramètre pour éviter la mise en cache
      const response = await axios.get(`http://localhost:8000/entreprises/me?timestamp=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Si la réponse est un objet unique, le convertir en tableau
      const entreprisesData = Array.isArray(response.data) ? response.data : [response.data]

      // Vérifier si les données sont valides
      if (entreprisesData && entreprisesData.length > 0 && entreprisesData[0].id) {
        // Trier les entreprises par date de création (la plus récente en premier)
        const sortedEntreprises = [...entreprisesData].sort((a, b) => {
          return new Date(b.date_creation) - new Date(a.date_creation)
        })

        setEntreprises(sortedEntreprises)

        // Calculer les statistiques
        const totalDemarches = entreprisesData.length
        const entreprisesValidees = entreprisesData.filter((e) => e.statut === "validé").length
        const entreprisesRejetees = entreprisesData.filter((e) => e.statut === "rejeté").length

        setStats({
          demarches: totalDemarches,
          entreprisesValidees,
          entreprisesRejetees,
        })
      } else {
        // Si les données ne sont pas valides, afficher un message
        setEntreprises([])
        console.warn("Données d'entreprises invalides:", response.data)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises:", err)

      // Message d'erreur plus détaillé
      if (err.response) {
        if (err.response.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.")
        } else {
          setError(
            `Erreur ${err.response.status}: ${err.response.data?.detail || "Impossible de récupérer vos démarches"}`,
          )
        }
      } else if (err.request) {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion internet.")
      } else {
        setError("Impossible de récupérer vos démarches. Veuillez réessayer plus tard.")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (statut) => {
    switch (statut) {
      case "en_attente":
        return "status-pending8"
      case "validé":
        return "status-approved8"
      case "rejeté":
        return "status-rejected8"
      default:
        return ""
    }
  }

  const getStatusIcon = (statut) => {
    switch (statut) {
      case "en_attente":
        return <Clock size={18} />
      case "validé":
        return <CheckCircle size={18} />
      case "rejeté":
        return <XCircle size={18} />
      default:
        return null
    }
  }

  const getStatusText = (statut) => {
    switch (statut) {
      case "en_attente":
        return "En attente"
      case "validé":
        return "Validé"
      case "rejeté":
        return "Rejeté"
      default:
        return statut
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleEditRequest = (entreprise) => {
    // Rediriger vers la page de création avec les données pré-remplies
    navigate("/client/creation", { state: { entrepriseToEdit: entreprise } })
  }

  // Fonction pour ouvrir la modal de confirmation de suppression
  const handleDeleteClick = (entreprise) => {
    // Vérifier si l'entreprise est validée
    if (entreprise.statut === "validé") {
      setError("Impossible de supprimer une entreprise validée. Veuillez contacter le support.")
      return
    }

    setEntrepriseToDelete(entreprise)
    setShowDeleteModal(true)
  }

  // Fonction pour effectuer la suppression
  const confirmDelete = async () => {
    if (!entrepriseToDelete) return

    setIsDeleting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Utiliser l'endpoint DELETE
      await axios.delete(`http://localhost:8000/entreprises/${entrepriseToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSuccess(`L'entreprise "${entrepriseToDelete.nom}" a été supprimée avec succès`)

      // Mettre à jour la liste des entreprises
      setEntreprises(entreprises.filter((e) => e.id !== entrepriseToDelete.id))

      // Fermer la modal
      setShowDeleteModal(false)
      setEntrepriseToDelete(null)
    } catch (err) {
      console.error("Erreur lors de la suppression:", err)

      // Message d'erreur détaillé
      if (err.response) {
        setError(err.response.data?.detail || "Erreur lors de la suppression. Veuillez réessayer plus tard.")
      } else {
        setError("Erreur lors de la suppression. Veuillez réessayer plus tard.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setEntrepriseToDelete(null)
  }

  // Récupérer les 3 dernières entreprises pour le tableau des activités récentes
  const recentEntreprises = entreprises.slice(0, 3)

  return (
    <div className="dashboard-container8">
      <div className="welcome-section8">
        <h1 className="welcome-title8">
          Bienvenue <span className="wave-emoji8">👋</span> !
        </h1>
        <p className="welcome-description8">
          On va vous guider pas à pas pour concrétiser votre projet entrepreneurial.
        </p>
      </div>

      {error && (
        <div className="error-message8">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message8">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Cartes de statistiques avec données réelles */}
      <div className="stats-cards-container8">
        <div className="stats-card8">
          <div className="stats-card-icon8">
            <FileText size={24} />
          </div>
          <div className="stats-card-content8">
            <h3 className="stats-card-title8">Démarches en cours</h3>
            <p className="stats-card-value8">{stats.demarches}</p>
            <p className="stats-card-description8">Nombre total de démarches</p>
          </div>
        </div>

        <div className="stats-card8">
          <div className="stats-card-icon8 success-icon8">
            <CheckCircle size={24} />
          </div>
          <div className="stats-card-content8">
            <h3 className="stats-card-title8">Entreprises validées</h3>
            <p className="stats-card-value8">{stats.entreprisesValidees}</p>
            <p className="stats-card-description8">Félicitations pour votre succès !</p>
          </div>
        </div>

        <div className="stats-card8">
          <div className="stats-card-icon8 warning-icon8">
            <XCircle size={24} />
          </div>
          <div className="stats-card-content8">
            <h3 className="stats-card-title8">Entreprises rejetées</h3>
            <p className="stats-card-value8">{stats.entreprisesRejetees}</p>
            <p className="stats-card-description8">Demandes nécessitant votre attention</p>
          </div>
        </div>
      </div>

      {/* Section des dernières activités (tableau similaire à MesDemarches) */}
      <div className="recent-activities-section8">
        <div className="recent-activities-header8">
          <h2 className="recent-activities-title8">Dernières activités</h2>
          <Link to="/client/demarches" className="view-all-link8">
            Voir toutes les démarches <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-container8">
            <div className="loading-spinner8"></div>
            <p>Chargement de vos démarches...</p>
          </div>
        ) : entreprises.length === 0 ? (
          <div className="empty-state8" style={{ padding: "20px", textAlign: "center" }}>
            <div className="empty-icon8">
              <FileText size={48} />
            </div>
            <h2>Aucune démarche en cours</h2>
            <p>Vous n'avez pas encore commencé de démarche. Créez une entreprise pour commencer.</p>
            <button className="new-company-button8" onClick={() => navigate("/client/creation")}>
              <Plus size={20} />
              Créer une entreprise
            </button>
          </div>
        ) : (
          <div className="demarches-table-container8">
            <table className="demarches-table8">
              <thead>
                <tr>
                  <th>Type</th>
                  <th></th>
                  <th>Date de création</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentEntreprises.map((entreprise) => (
                  <tr key={entreprise.id}>
                    <td>{entreprise.type}</td>
                    <td>{entreprise.nom}</td>
                    <td>{formatDate(entreprise.date_creation)}</td>
                    <td>
                      <div className={`status-badge8 ${getStatusClass(entreprise.statut)}`}>
                        {getStatusIcon(entreprise.statut)}
                        <span>{getStatusText(entreprise.statut)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions8">
                        {entreprise.statut === "validé" && (
                          <button
                            className="action-button8 export-button8"
                            onClick={() => navigate(`/client/demarches`)}
                            title="Exporter les documents"
                          >
                            <Download size={18} />
                          </button>
                        )}
                        {entreprise.statut === "rejeté" && (
                          <button
                            className="action-button8 info-button8"
                            onClick={() => navigate(`/client/demarches`)}
                            title="Voir le motif de rejet"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                        <button
                          className="action-button8 edit-button8"
                          onClick={() => handleEditRequest(entreprise)}
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className={`action-button8 delete-button8 ${entreprise.statut === "validé" ? "disabled8" : ""}`}
                          onClick={() => handleDeleteClick(entreprise)}
                          title={
                            entreprise.statut === "validé"
                              ? "Impossible de supprimer une entreprise validée"
                              : "Supprimer"
                          }
                          disabled={entreprise.statut === "validé" || isDeleting}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay8">
          <div className="delete-modal8">
            <div className="modal-header8">
              <h2>Confirmer la suppression</h2>
              <button className="close-button8" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="modal-content8">
              <div className="delete-warning8">
                <XCircle size={48} className="delete-icon8" />
                <p>
                  Êtes-vous sûr de vouloir supprimer l'entreprise <strong>{entrepriseToDelete?.nom}</strong> ?
                </p>
                <p className="delete-note8">Cette action est irréversible.</p>
              </div>
            </div>

            <div className="modal-footer8">
              <button className="secondary-button8" onClick={closeDeleteModal}>
                Annuler
              </button>
              <button className="danger-button8" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <span className="loading-spinner8"></span>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
