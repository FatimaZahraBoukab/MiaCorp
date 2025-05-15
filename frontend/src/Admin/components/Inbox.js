"use client"

import { useState, useEffect } from "react"
import { Inbox, CheckCircle, Trash2, Mail, ExternalLink, Search, Filter, RefreshCw, Eye, X } from "lucide-react"
import "./Inbox.css"

const InboxManager = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" })
  const [filterStatus, setFilterStatus] = useState("all") // all, read, unread
  const [modalOpen, setModalOpen] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/contact/")
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
    } finally {
      setLoading(false)
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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return
    }

    try {
      await fetch(`http://localhost:8000/contact/${id}`, { method: "DELETE" })
      fetchMessages()
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error)
    }
  }

  // Fonction pour tronquer le texte s'il est trop long
  const truncateText = (text, maxLength = 50) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Fonction pour trier les messages
  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Fonction pour afficher les flèches de tri
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === "asc" ? "↑" : "↓"
  }

  // Filtrer et trier les messages
  const filteredAndSortedMessages = () => {
    let filtered = [...messages]

    // Filtrer par statut
    if (filterStatus === "read") {
      filtered = filtered.filter((msg) => msg.lu)
    } else if (filterStatus === "unread") {
      filtered = filtered.filter((msg) => !msg.lu)
    }

    // Filtrer par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (msg) =>
          (msg.firstName && msg.firstName.toLowerCase().includes(term)) ||
          (msg.lastName && msg.lastName.toLowerCase().includes(term)) ||
          (msg.email && msg.email.toLowerCase().includes(term)) ||
          (msg.message && msg.message.toLowerCase().includes(term)),
      )
    }

    // Trier
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Gestion des valeurs null ou undefined
        if (!a[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1
        if (!b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1

        // Tri par nom complet si la clé est firstName
        if (sortConfig.key === "firstName") {
          const nameA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase()
          const nameB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase()
          return sortConfig.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        }

        // Tri standard pour les autres clés
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }

  // Afficher le message complet
  const viewFullMessage = (message) => {
    setCurrentMessage(message)
    setModalOpen(true)

    // Marquer comme lu si ce n'est pas déjà fait
    if (!message.lu) {
      markAsRead(message.id)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setCurrentMessage(null)
  }

  return (
    <div className="v0-inbox-manager">
      {/* Header with actions */}
      <div className="v0-section-header">
        <div className="v0-section-title">
          <Inbox size={24} />
          <h2>Boîte de réception</h2>
        </div>
        <div className="v0-section-actions">
          <button className="v0-btn v0-btn-outline" onClick={fetchMessages}>
            <RefreshCw size={16} />
            <span className="v0-btn-text">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="v0-inbox-controls">
        <div className="v0-search-box">
          <Search size={18} className="v0-search-icon" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="v0-form-control v0-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="v0-filter-box">
          <Filter size={18} className="v0-filter-icon" />
          <select
            className="v0-form-control v0-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tous les messages</option>
            <option value="read">Messages lus</option>
            <option value="unread">Messages non lus</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      <div className="v0-messages-table">
        {loading ? (
          <div className="v0-loading-state">
            <div className="v0-spinner"></div>
            <p>Chargement des messages...</p>
          </div>
        ) : filteredAndSortedMessages().length === 0 ? (
          <div className="v0-empty-state">
            <Mail size={48} />
            <p>Aucun message disponible</p>
          </div>
        ) : (
          <div className="v0-table-container">
            <table className="v0-table v0-inbox-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort("firstName")}>Expéditeur {getSortIndicator("firstName")}</th>
                  <th onClick={() => requestSort("email")}>Email {getSortIndicator("email")}</th>
                  <th>Message</th>
                  <th onClick={() => requestSort("lu")}>Statut {getSortIndicator("lu")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMessages().map((msg) => (
                  <tr key={msg.id} className={!msg.lu ? "v0-unread-row" : ""}>
                    <td>
                      {msg.firstName || ""} {msg.lastName || ""}
                    </td>
                    <td>
                      <a href={`mailto:${msg.email}`} className="v0-email-link-dark">
                        {msg.email}
                        <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="v0-message-preview" onClick={() => viewFullMessage(msg)}>
                      {truncateText(msg.message)}
                    </td>
                    <td>
                      <span className={`v0-badge ${msg.lu ? "v0-badge-success" : "v0-badge-warning"}`}>
                        {msg.lu ? "Lu" : "Non lu"}
                      </span>
                    </td>
                    <td>
                      <div className="v0-table-actions">
                        <button
                          className="v0-btn v0-btn-primary v0-btn-sm"
                          onClick={() => viewFullMessage(msg)}
                          title="Voir le message"
                        >
                          <Eye size={16} />
                        </button>
                        {!msg.lu && (
                          <button
                            className="v0-btn v0-btn-success v0-btn-sm"
                            onClick={() => markAsRead(msg.id)}
                            title="Marquer comme lu"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          className="v0-btn v0-btn-danger v0-btn-sm"
                          onClick={() => deleteMessage(msg.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
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

      {/* Modal pour afficher le message complet */}
      {modalOpen && currentMessage && (
        <div className="v0-message-modal-overlay" onClick={closeModal}>
          <div className="v0-message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v0-message-modal-header">
              <h3>
                Message de {currentMessage.firstName} {currentMessage.lastName}
              </h3>
              <button className="v0-modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="v0-message-modal-content">
              <div className="v0-message-info">
                <div className="v0-message-info-item">
                  <span className="v0-message-info-label">Email:</span>
                  <a href={`mailto:${currentMessage.email}`} className="v0-email-link-dark">
                    {currentMessage.email}
                  </a>
                </div>
                <div className="v0-message-info-item">
                  <span className="v0-message-info-label">Date:</span>
                  <span>{currentMessage.date || new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="v0-message-body">
                <h4>Message:</h4>
                <div className="v0-message-text">{currentMessage.message}</div>
              </div>
            </div>
            <div className="v0-message-modal-footer">
              <button className="v0-btn v0-btn-outline" onClick={closeModal}>
                Fermer
              </button>
              <button
                className="v0-btn v0-btn-danger"
                onClick={() => {
                  deleteMessage(currentMessage.id)
                  closeModal()
                }}
              >
                <Trash2 size={16} />
                <span className="v0-btn-text">Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InboxManager
