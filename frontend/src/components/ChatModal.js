"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { MessageCircle, Send, X, User, Clock, AlertCircle } from "lucide-react"
import "./ChatModal.css"

const ChatModal = ({ isOpen, onClose, entrepriseId, entrepriseType, currentUser }) => {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef(null)

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Charger la conversation quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && entrepriseId) {
      loadConversation()
    }
  }, [isOpen, entrepriseId])

  // Marquer les messages comme lus quand on ouvre la conversation
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

      // Essayer de récupérer la conversation existante
      try {
        const response = await axios.get(`http://localhost:8000/conversations/entreprise/${entrepriseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setConversation(response.data)
        setMessages(response.data.messages || [])
      } catch (err) {
        if (err.response?.status === 404) {
          // Créer une nouvelle conversation si elle n'existe pas
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    setSending(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://localhost:8000/conversations/${conversation.id}/messages`,
        {
          contenu: newMessage.trim(),
          conversation_id: conversation.id,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Ajouter le nouveau message à la liste
      setMessages((prev) => [...prev, response.data])
      setNewMessage("")
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err)
      setError("Impossible d'envoyer le message")
    } finally {
      setSending(false)
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

  const isMyMessage = (message) => {
    return message.expediteur_id === currentUser.id
  }

  if (!isOpen) return null

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header">
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
                  <div className="message-content">{message.contenu}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="chat-input">
          <div className="input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              rows={2}
              disabled={sending}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="send-btn">
              {sending ? <div className="loading-spinner small"></div> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatModal
