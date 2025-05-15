"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Info,
} from "lucide-react"
import "../styles/mes-demarches.css"

const MesDemarches = () => {
  const navigate = useNavigate()
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState("pdf")
  const [isDownloading, setIsDownloading] = useState(false)
  const [availableDocuments, setAvailableDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entrepriseToDelete, setEntrepriseToDelete] = useState(null)
  const [showRejectCommentModal, setShowRejectCommentModal] = useState(false)
  const [selectedRejectedEntreprise, setSelectedRejectedEntreprise] = useState(null)
  const [loadingComment, setLoadingComment] = useState(false)

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

      // Ajouter ces logs pour déboguer
      console.log("Données d'entreprises reçues:", entreprisesData)
      entreprisesData.forEach((entreprise) => {
        if (entreprise.statut === "rejeté") {
          console.log(`Entreprise rejetée ${entreprise.id}:`, entreprise)
          console.log(`Commentaire:`, entreprise.commentaires)
          console.log(`Type de commentaire:`, typeof entreprise.commentaires)
        }
      })

      // Vérifier si les données sont valides
      if (entreprisesData && entreprisesData.length > 0 && entreprisesData[0].id) {
        setEntreprises(entreprisesData)
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

  const handleDropdownToggle = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id)
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

  const handleExportClick = async (entreprise) => {
    setSelectedEntreprise(entreprise)
    setLoadingDocuments(true)

    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:8000/documents/available/${entreprise.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setAvailableDocuments(response.data.documents || [])

      // Sélectionner le premier document par défaut s'il existe
      if (response.data.documents && response.data.documents.length > 0) {
        setSelectedDocument(response.data.documents[0])
      } else {
        setSelectedDocument(null)
      }

      setShowExportModal(true)
    } catch (err) {
      console.error("Erreur lors du chargement des documents disponibles:", err)
      setError("Impossible de charger la liste des documents disponibles")
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleDownloadDocument = async () => {
    if (!selectedEntreprise || !selectedDocument) return

    setIsDownloading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Utiliser une URL avec tous les paramètres nécessaires
      const downloadUrl = `http://localhost:8000/documents/export/${selectedEntreprise.id}?format=${downloadFormat}&document_index=${selectedDocument.index}&timestamp=${new Date().getTime()}`

      console.log("URL de téléchargement:", downloadUrl)

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          // Ne pas définir Content-Type pour les téléchargements de fichiers
        },
      })

      if (!response.ok) {
        // Essayer de lire le corps de la réponse pour obtenir plus de détails sur l'erreur
        let errorDetail = "Erreur lors du téléchargement du document"
        try {
          const errorData = await response.json()
          errorDetail = errorData.detail || errorDetail
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le texte brut
          errorDetail = (await response.text()) || errorDetail
        }

        console.error("Erreur de téléchargement:", response.status, errorDetail)
        throw new Error(`${errorDetail} (${response.status})`)
      }

      // Récupérer le blob du document
      const blob = await response.blob()

      // Vérifier que le blob a un contenu
      if (blob.size === 0) {
        throw new Error("Le document téléchargé est vide")
      }

      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob)

      // Créer un lien temporaire pour télécharger le fichier
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url

      // Déterminer le nom du fichier
      const docName = selectedDocument?.titre || `document_${selectedDocument.index}`
      const extension = downloadFormat === "pdf" ? "pdf" : "docx"
      a.download = `${docName}.${extension}`

      // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
      document.body.appendChild(a)
      a.click()

      // Petit délai avant de révoquer l'URL pour s'assurer que le téléchargement a commencé
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

      setSuccess(`Document "${docName}" téléchargé avec succès au format ${downloadFormat.toUpperCase()}`)
      setShowExportModal(false)
    } catch (err) {
      console.error("Erreur détaillée lors du téléchargement:", err)
      setError(err.message || "Erreur lors du téléchargement du document")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleEditRequest = (entreprise) => {
    // Rediriger vers la page de création avec les données pré-remplies
    navigate("/client/creation", { state: { entrepriseToEdit: entreprise } })
    setActiveDropdown(null)
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

  const closeModal = () => {
    setShowExportModal(false)
    setSelectedEntreprise(null)
    setSelectedDocument(null)
    setDownloadFormat("pdf")
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setEntrepriseToDelete(null)
  }

  const handleShowRejectComment = async (entreprise) => {
    console.log("Entreprise rejetée sélectionnée:", entreprise)
    setLoadingComment(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Utiliser le nouvel endpoint spécifique pour récupérer le commentaire de rejet
      const response = await axios.get(`http://localhost:8000/entreprises/${entreprise.id}/rejection-comment`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("Détails du rejet récupérés:", response.data)
      setSelectedRejectedEntreprise(response.data)
      setShowRejectCommentModal(true)
    } catch (err) {
      console.error("Erreur lors de la récupération des détails du rejet:", err)
      setError("Impossible de récupérer les détails du rejet. Veuillez réessayer plus tard.")

      // Utiliser les données existantes comme fallback
      setSelectedRejectedEntreprise({
        ...entreprise,
        commentaires: entreprise.commentaires || "Aucun commentaire disponible.",
      })
      setShowRejectCommentModal(true)
    } finally {
      setLoadingComment(false)
    }
  }

  const closeRejectCommentModal = () => {
    setShowRejectCommentModal(false)
    setSelectedRejectedEntreprise(null)
  }

  // Fonction pour effacer les messages après un certain temps
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("")
        setError("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  return (
    <div className="demarches-container8">
      <div className="demarches-header8">
        <div className="demarches-title-section8">
          <h1>Mes démarches</h1>
        </div>
        <button className="refresh-button8" onClick={fetchEntreprises} title="Rafraîchir">
          <RefreshCw size={18} />
          <span>Rafraîchir</span>
        </button>
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

      {loading ? (
        <div className="loading-container8">
          <div className="loading-spinner8"></div>
          <p>Chargement de vos démarches...</p>
        </div>
      ) : entreprises.length === 0 ? (
        <div className="empty-state8">
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
        <>
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
                {entreprises.map((entreprise) => (
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
                            onClick={() => handleExportClick(entreprise)}
                            title="Exporter les documents"
                          >
                            <Download size={18} />
                          </button>
                        )}
                        {entreprise.statut === "rejeté" && (
                          <button
                            className="action-button8 info-button8"
                            onClick={() => handleShowRejectComment(entreprise)}
                            title="Voir le motif de rejet"
                            disabled={loadingComment}
                          >
                            <Info size={18} />
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

          <button className="new-company-button8" onClick={() => navigate("/client/creation")}>
            <Plus size={20} />
            Créer une nouvelle entreprise
          </button>
        </>
      )}

      {/* Modal d'exportation */}
      {showExportModal && (
        <div className="modal-overlay8">
          <div className="export-modal8">
            <div className="modal-header8">
              <h2>Exporter les documents</h2>
              <button className="close-button8" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-content8">
              {loadingDocuments ? (
                <div className="loading-container8">
                  <div className="loading-spinner8"></div>
                  <p>Chargement des documents disponibles...</p>
                </div>
              ) : availableDocuments.length === 0 ? (
                <div className="no-documents8">
                  <p>Aucun document n'est disponible pour le téléchargement.</p>
                </div>
              ) : (
                <>
                  <div className="document-selection8">
                    <h3>Documents disponibles :</h3>
                    <div className="document-list8">
                      {availableDocuments.map((doc) => (
                        <div
                          key={doc.index}
                          className={`document-item8 ${selectedDocument?.index === doc.index ? "selected8" : ""}`}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <FileText size={20} className="document-icon8" />
                          <div className="document-info8">
                            <h4>{doc.titre}</h4>
                            {doc.description && <p>{doc.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDocument && (
                    <>
                      <div className="format-selection8">
                        <h3>Format d'exportation :</h3>
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
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer8">
              <button className="secondary-button8" onClick={closeModal}>
                Annuler
              </button>
              <button
                className="primary-button8"
                onClick={handleDownloadDocument}
                disabled={isDownloading || !selectedDocument}
              >
                {isDownloading ? (
                  <>
                    <span className="loading-spinner8"></span>
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Télécharger
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal pour afficher le commentaire de rejet */}
      {showRejectCommentModal && selectedRejectedEntreprise && (
        <div className="modal-overlay8">
          <div className="reject-comment-modal8">
            <div className="modal-header8">
              <h2>Motif de rejet</h2>
              <button className="close-button8" onClick={closeRejectCommentModal}>
                ×
              </button>
            </div>

            <div className="modal-content8">
              <div className="reject-comment-container8">
                <div className="reject-icon-container8">
                  <XCircle size={48} className="reject-icon8" />
                </div>
                <div className="reject-details8">
                  <h3>Entreprise : {selectedRejectedEntreprise.nom}</h3>
                  <p className="reject-date8">Date de rejet : {formatDate(selectedRejectedEntreprise.date_rejet)}</p>
                  <div className="comment-box8">
                    <h4>Commentaire de l'expert :</h4>
                    <p>
                      {selectedRejectedEntreprise.commentaires && selectedRejectedEntreprise.commentaires.trim() !== ""
                        ? selectedRejectedEntreprise.commentaires
                        : "Aucun commentaire fourni."}
                    </p>
                  </div>
                  <p className="reject-help8">
                    Vous pouvez modifier votre demande en tenant compte de ces commentaires et la soumettre à nouveau.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer8">
              <button className="secondary-button8" onClick={closeRejectCommentModal}>
                Fermer
              </button>
              <button
                className="primary-button8"
                onClick={() => {
                  closeRejectCommentModal()
                  handleEditRequest(selectedRejectedEntreprise)
                }}
              >
                Modifier ma demande
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="demarches-info-section8">
        <h2>Comment suivre mes démarches ?</h2>
        <div className="demarches-info-content8">
          <div className="info-item8">
            <div className="info-icon8 pending-icon8">
              <Clock size={24} />
            </div>
            <div className="info-text8">
              <h3>En attente</h3>
              <p>Votre demande est en cours d'analyse par nos experts. La décision sera prise (délai maximum 24h).</p>
            </div>
          </div>

          <div className="info-item8">
            <div className="info-icon8 approved-icon8">
              <CheckCircle size={24} />
            </div>
            <div className="info-text8">
              <h3>Validé</h3>
              <p>
                Votre entreprise a été validée ! Vous pouvez télécharger vos documents officiels en cliquant sur le
                bouton "Exporter".
              </p>
            </div>
          </div>

          <div className="info-item8">
            <div className="info-icon8 rejected-icon8">
              <XCircle size={24} />
            </div>
            <div className="info-text8">
              <h3>Rejeté</h3>
              <p>
                Votre demande a été rejetée. Vous pouvez modifier votre demande pour la soumettre à nouveau en utilisant
                l'option "Modifier ma demande".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MesDemarches
