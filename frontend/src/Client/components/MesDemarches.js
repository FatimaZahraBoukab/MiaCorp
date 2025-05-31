"use client"

import { useState, useEffect, useRef } from "react"
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
  MessageCircle,
  Send,
  User,
  X,
  AlertCircle,
  Paperclip,
  ImageIcon,
  File,
  TrashIcon,
} from "lucide-react"
import "../styles/mes-demarches.css"
import "../styles/chat-attachments.css" 

// Composant ChatModal MODIFIÉ avec support des fichiers
const ChatModal = ({ isOpen, onClose, entrepriseId, entrepriseType, currentUser }) => {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [attachments, setAttachments] = useState([]) // NOUVEAU
  const [uploading, setUploading] = useState(false) // NOUVEAU
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null) // NOUVEAU

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && entrepriseId) {
      loadConversation()
    }
  }, [isOpen, entrepriseId])

  useEffect(() => {
    if (conversation && messages.length > 0) {
      markAsRead()
    }
  }, [conversation, messages])

  const loadConversation = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      try {
        const response = await axios.get(`http://localhost:8000/conversations/entreprise/${entrepriseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setConversation(response.data)
        setMessages(response.data.messages || [])
      } catch (err) {
        if (err.response?.status === 404) {
          await createConversation()
        } else {
          throw err
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la conversation:", err)
      setError("Impossible de charger la conversation")
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:8000/conversations/",
        {
          entreprise_id: entrepriseId,
          sujet: `Discussion sur l'entreprise ${entrepriseType}`,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setConversation(response.data)
      setMessages([])
    } catch (err) {
      console.error("Erreur lors de la création de la conversation:", err)
      setError("Impossible de créer la conversation")
    }
  }

  // NOUVELLES FONCTIONS pour la gestion des fichiers
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ]

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        setError(`Le fichier ${file.name} est trop volumineux (max 10MB)`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`Le type de fichier ${file.name} n'est pas autorisé`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      processFiles(validFiles)
    }
  }

  const processFiles = async (files) => {
    setUploading(true)
    const newAttachments = []

    for (const file of files) {
      try {
        const base64 = await fileToBase64(file)
        const attachment = {
          nom_fichier: file.name,
          type_fichier: getFileType(file.type),
          taille_fichier: file.size,
          contenu_base64: base64.split(",")[1], // Enlever le préfixe data:...;base64,
          preview: file.type.startsWith("image/") ? base64 : null,
        }
        newAttachments.push(attachment)
      } catch (err) {
        console.error(`Erreur lors du traitement du fichier ${file.name}:`, err)
        setError(`Erreur lors du traitement du fichier ${file.name}`)
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments])
    setUploading(false)
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const getFileType = (mimeType) => {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType === "text/plain") return "document"
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return "archive"
    return "other"
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !conversation) return

    setSending(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://localhost:8000/conversations/${conversation.id}/messages`,
        {
          contenu: newMessage.trim() || "📎 Fichier(s) joint(s)",
          conversation_id: conversation.id,
          attachments: attachments, // NOUVEAU : Envoyer les attachements
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setMessages((prev) => [...prev, response.data])
      setNewMessage("")
      setAttachments([]) // NOUVEAU : Vider les attachements après envoi
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err)
      setError("Impossible d'envoyer le message")
    } finally {
      setSending(false)
    }
  }

  const downloadAttachment = async (attachmentId, filename) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:8000/conversations/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err)
      setError("Impossible de télécharger le fichier")
    }
  }

  const markAsRead = async () => {
    if (!conversation) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/conversations/${conversation.id}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type) => {
    switch (type) {
      case "image":
        return <ImageIcon size={16} />
      case "document":
        return <FileText size={16} />
      default:
        return <File size={16} />
    }
  }

  const isMyMessage = (message) => {
    return message.expediteur_id === currentUser.id
  }

  if (!isOpen) return null

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header56">
          <div className="chat-header-info">
            <MessageCircle size={20} />
            <div>
              <h3>Discussion - {entrepriseType}</h3>
              <p>Conversation avec {currentUser.role === "client" ? "l'expert" : "le client"}</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="chat-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <p>Chargement de la conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={48} />
              <p>Aucun message pour le moment</p>
              <p>Commencez la conversation en envoyant un message</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className={`message ${isMyMessage(message) ? "message-own" : "message-other"}`}>
                  <div className="message-header">
                    <div className="message-sender">
                      <User size={14} />
                      <span>{message.expediteur_nom}</span>
                      <span className={`role-badge ${message.expediteur_role}`}>
                        {message.expediteur_role === "client" ? "Client" : "Expert"}
                      </span>
                    </div>
                    <div className="message-time">
                      <Clock size={12} />
                      <span>{formatTime(message.date_envoi)}</span>
                    </div>
                  </div>
                  <div className="message-content">
                    {message.contenu}

                    {/* NOUVEAU : Affichage des attachements */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="attachment-item">
                            <div className="attachment-info">
                              {getFileIcon(attachment.type_fichier)}
                              <div className="attachment-details">
                                <span className="attachment-name">{attachment.nom_fichier}</span>
                                <span className="attachment-size">{formatFileSize(attachment.taille_fichier)}</span>
                              </div>
                            </div>
                            <button
                              className="attachment-download"
                              onClick={() => downloadAttachment(attachment.id, attachment.nom_fichier)}
                              title="Télécharger"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* NOUVEAU : Zone d'aperçu des fichiers sélectionnés */}
        {attachments.length > 0 && (
          <div className="attachments-preview">
            <div className="attachments-header">
              <span>Fichiers à envoyer ({attachments.length})</span>
            </div>
            <div className="attachments-list">
              {attachments.map((attachment, index) => (
                <div key={index} className="attachment-preview">
                  {attachment.preview ? (
                    <img
                      src={attachment.preview || "/placeholder.svg"}
                      alt={attachment.nom_fichier}
                      className="attachment-image"
                    />
                  ) : (
                    <div className="attachment-file-icon">{getFileIcon(attachment.type_fichier)}</div>
                  )}
                  <div className="attachment-info">
                    <span className="attachment-name">{attachment.nom_fichier}</span>
                    <span className="attachment-size">{formatFileSize(attachment.taille_fichier)}</span>
                  </div>
                  <button className="attachment-remove" onClick={() => removeAttachment(index)} title="Supprimer">
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input">
          <div className="input-container">
            {/* NOUVEAU : Bouton d'attachement */}
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              title="Joindre un fichier"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              rows={2}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && attachments.length === 0) || sending || uploading}
              className="send-btn"
            >
              {sending ? <div className="loading-spinner small"></div> : <Send size={18} />}
            </button>
          </div>
          {/* NOUVEAU : Input file caché */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.zip,.rar,.7z"
          />
        </div>
      </div>
    </div>
  )
}


const ConversationButton = ({ entrepriseId, entrepriseType, currentUser, className = "", size = 18 }) => {
  const [showChat, setShowChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/conversations/", {
          headers: { Authorization: `Bearer ${token}` },
        })

        const conversation = response.data.find((conv) => conv.entreprise_id === entrepriseId)
        if (conversation) {
          setUnreadCount(conversation.non_lus || 0)
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des messages non lus:", err)
      }
    }

    if (entrepriseId && currentUser) {
      fetchUnreadCount()
    }
  }, [entrepriseId, currentUser])

  const handleOpenChat = (e) => {
    e.stopPropagation()
    setShowChat(true)
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setUnreadCount(0)
  }


  return (
    <>
      <button
        className={`conversation-btn ${className}`}
        onClick={handleOpenChat}
        title="Ouvrir la conversation"
        style={{ position: "relative" }}
      >
        <MessageCircle size={size} />
        {unreadCount > 0 && (
          <span
            className="notification-badge"
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "50%",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "bold",
              lineHeight: "1",
              padding: "2px",
              boxShadow: "0 2px 4px rgba(220, 53, 69, 0.3)",
              border: "2px solid white",
              animation: "pulse 2s infinite",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <ChatModal
        isOpen={showChat}
        onClose={handleCloseChat}
        entrepriseId={entrepriseId}
        entrepriseType={entrepriseType}
        currentUser={currentUser}
      />
    </>
  )
}

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
  const [currentUser, setCurrentUser] = useState(null)

  // Récupérer les informations de l'utilisateur actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCurrentUser(response.data)
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err)
      }
    }

    fetchCurrentUser()
  }, [])

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
    if (!dateString) return ""
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

  // Ajouter les styles pour les notifications
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .conversation-btn {
      background-color: #17a2b8;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .conversation-btn:hover {
      background-color: #138496;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(23, 162, 184, 0.2);
    }
  `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

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
                    <td>{entreprise.nom || ""}</td>
                    <td>{formatDate(entreprise.date_creation)}</td>
                    <td>
                      <div className={`status-badge8 ${getStatusClass(entreprise.statut)}`}>
                        {getStatusIcon(entreprise.statut)}
                        <span>{getStatusText(entreprise.statut)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions8">
                        {/* Bouton de conversation - toujours visible */}
                        {currentUser && (
                          <ConversationButton
                            entrepriseId={entreprise.id}
                            entrepriseType={entreprise.type}
                            currentUser={currentUser}
                            className="table-action"
                          />
                        )}

                        {/* Autres boutons existants */}
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
                          className={`action-button8 delete-button8 ${
                            entreprise.statut === "validé" ? "disabled8" : ""
                          }`}
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
