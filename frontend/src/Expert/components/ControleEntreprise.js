"use client"

import { useState, useEffect, useRef } from "react"
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
  MessageCircle,
  Send,
  Clock,
  X,
  Paperclip,
  Download,
  ImageIcon,
  File,
  Trash2,
} from "lucide-react"
import "../entreprise-table.css"
import "../../Client/styles/chat-attachments.css" // NOUVEAU : Importer les styles pour les attachements

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
                    <Trash2 size={14} />
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

// Le reste du composant reste identique...
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

const ControleEntrepriseV5 = ({ entreprises: initialEntreprises, fetchEntreprises, setSuccessMsg, setErrorMsg }) => {
  // Tout le reste de votre code existant reste identique...
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [comments, setComments] = useState("")
  const [entreprises, setEntreprises] = useState(initialEntreprises || [])
  const [allEntreprises, setAllEntreprises] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
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

      try {
        const response = await axios.get("http://localhost:8000/entreprises/all", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAllEntreprises(response.data)
        setIsLoading(false)
      } catch (err) {
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

  const getFilteredVariables = (variables) => {
    if (!searchTerm || !variables) return variables

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filteredEntries = Object.entries(variables).filter(([key, value]) => {
      return key.toLowerCase().includes(lowerSearchTerm) || String(value).toLowerCase().includes(lowerSearchTerm)
    })

    return Object.fromEntries(filteredEntries)
  }

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
                  <th style={{ width: "20%" }}>Type</th>
                  <th style={{ width: "20%" }}>Date de création</th>
                  <th style={{ width: "20%" }}>Statut</th>
                  <th style={{ width: "40%" }}>Actions</th>
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
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        {currentUser && (
                          <ConversationButton
                            entrepriseId={entreprise.id}
                            entrepriseType={entreprise.type}
                            currentUser={currentUser}
                            className="table-action"
                          />
                        )}

                        <button
                          className="v5-entreprise-action-btn"
                          onClick={() => handleSelectEntreprise(entreprise.id)}
                          title="Voir les détails"
                        >
                          <Eye size={16} className="v5-action-icon" />
                        </button>
                      </div>
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
