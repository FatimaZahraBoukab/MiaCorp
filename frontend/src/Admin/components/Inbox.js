"use client"

import { useState, useEffect } from "react"

const InboxManager = () => {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:8000/contact/")
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/contact/${id}/lu`, { method: "PUT" })
      fetchMessages()
    } catch (error) {
      console.error("Erreur lors du marquage du message comme lu:", error)
    }
  }

  const deleteMessage = async (id) => {
    try {
      await fetch(`http://localhost:8000/contact/${id}`, { method: "DELETE" })
      fetchMessages()
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error)
    }
  }

  return (
    <div className="section-container fade-in">
      <h2 className="section-title">
        <svg
          className="section-title-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        Boîte de réception
      </h2>
      {messages.length === 0 ? (
        <p>Aucun message disponible</p>
      ) : (
        <div className="templates-grid">
          {messages.map((msg) => (
            <div key={msg.id} className="template-card">
              <h3>
                {msg.firstName} {msg.lastName}
              </h3>
              <p>
                <strong>Email:</strong> {msg.email}
              </p>
              <p>
                <strong>Message:</strong> {msg.message}
              </p>
              <p>
                <strong>Lu:</strong> {msg.lu ? "Oui" : "Non"}
              </p>
              <div className="template-actions">
                {!msg.lu && (
                  <button className="edit-btn" onClick={() => markAsRead(msg.id)}>
                    Marquer comme lu
                  </button>
                )}
                <button className="delete-btn" onClick={() => deleteMessage(msg.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InboxManager
