"use client"

import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"
import axios from "axios"
import ChatModal from "./ChatModal"

const ConversationButton = ({ entrepriseId, entrepriseType, currentUser, className = "", size = 18 }) => {
  const [showChat, setShowChat] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Récupérer le nombre de messages non lus pour cette entreprise
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:8000/conversations/", {
          headers: { Authorization: `Bearer ${token}` },
        })

        // Trouver la conversation pour cette entreprise
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
    e.stopPropagation() // Empêcher la propagation si le bouton est dans un tableau
    setShowChat(true)
  }

  const handleCloseChat = () => {
    setShowChat(false)
    // Remettre à zéro le compteur après avoir ouvert le chat
    setUnreadCount(0)
  }

  return (
    <>
      <button className={`conversation-btn ${className}`} onClick={handleOpenChat} title="Ouvrir la conversation">
        <MessageCircle size={size} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
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

export default ConversationButton
