"use client"

import { useState, useEffect } from "react"
import { FileText, Users, Eye, Edit, Trash2, Plus, ArrowRight } from "lucide-react"
import axios from "axios"
import "./Dashboard.css"

const Dashboard = ({ stats }) => {
  const [loading, setLoading] = useState(true)
  const [recentData, setRecentData] = useState({
    templates: [],
  })

  useEffect(() => {
    // Fonction pour récupérer les données récentes
    const fetchRecentData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          console.error("Aucun token trouvé")
          return
        }

        // Récupérer les templates récents
        const templatesResponse = await axios.get("http://localhost:8000/templates/?limit=3", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setRecentData({
          templates: templatesResponse.data.slice(0, 3) || [],
        })
      } catch (error) {
        console.error("Erreur lors de la récupération des données récentes:", error)
        // En cas d'erreur, utiliser des données simulées pour la démonstration
        setRecentData({
          templates: [
            { id: 1, titre: "Statuts SAS", type_entreprise: "SAS", statut: "validé", date_creation: "2023-05-10" },
            {
              id: 2,
              titre: "Contrat de travail",
              type_entreprise: "SARL",
              statut: "en_attente",
              date_creation: "2023-05-09",
            },
            {
              id: 3,
              titre: "Pacte d'associés",
              type_entreprise: "SASU",
              statut: "validé",
              date_creation: "2023-05-08",
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecentData()
  }, [])

  // Fonction pour obtenir la classe CSS du badge de statut
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "validé":
        return "v0-badge v0-badge-success"
      case "rejeté":
        return "v0-badge v0-badge-danger"
      default:
        return "v0-badge v0-badge-warning"
    }
  }

  // Fonction pour naviguer vers la page des templates
  const navigateToTemplates = () => {
    // Changer l'onglet actif dans le parent
    if (window.parent && window.parent.setActiveTab) {
      window.parent.setActiveTab("templates")
    } else {
      // Fallback si la fonction n'est pas disponible
      window.location.href = "#templates"
    }
  }

  // Fonction pour éditer un template
  const handleEditTemplate = (templateId) => {
    navigateToTemplates()
  }

  // Fonction pour voir les documents d'un template
  const handleViewDocuments = (template) => {
    navigateToTemplates()
  }

  return (
    <div className="v0-dashboard">
      {/* Section de bienvenue */}
      <div className="v0-welcome-section">
        <h1>
          Bienvenue <span className="v0-wave-emoji">👋</span> !
        </h1>
        <p>Prenez le contrôle de votre projet depuis votre espace d’administration.</p>
      </div>

      {/* Statistiques */}
      <div className="v0-stats-grid">
        <div className="v0-stat-card">
          <div className="v0-stat-icon">
            <FileText size={24} />
          </div>
          <div className="v0-stat-content">
            <span className="v0-stat-value">{stats.totalTemplates}</span>
            <span className="v0-stat-label">Templates</span>
          </div>
        </div>

        <div className="v0-stat-card">
          <div className="v0-stat-icon">
            <Users size={24} />
          </div>
          <div className="v0-stat-content">
            <span className="v0-stat-value">{stats.totalUsers}</span>
            <span className="v0-stat-label">Utilisateurs</span>
          </div>
        </div>

        <div className="v0-stat-card">
          <div className="v0-stat-icon v0-active">
            <Users size={24} />
          </div>
          <div className="v0-stat-content">
            <span className="v0-stat-value">{stats.activeUsers}</span>
            <span className="v0-stat-label">Utilisateurs actifs</span>
          </div>
        </div>

        <div className="v0-stat-card">
          <div className="v0-stat-icon v0-inactive">
            <Users size={24} />
          </div>
          <div className="v0-stat-content">
            <span className="v0-stat-value">{stats.inactiveUsers}</span>
            <span className="v0-stat-label">Utilisateurs inactifs</span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="v0-loading-state">
          <div className="v0-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      ) : (
        <div className="v0-dashboard-content">
          {/* Templates récents */}
          <div className="v0-templates-manager">
            <div className="v0-section-header">
              <div className="v0-section-title">
                <FileText size={24} />
                <h2>Templates récents</h2>
              </div>
              <button onClick={navigateToTemplates} className="v0-view-all">
                Voir tout <ArrowRight size={16} />
              </button>
            </div>
            <div className="v0-templates-list">
              {recentData.templates.length === 0 ? (
                <div className="v0-empty-state">
                  <FileText size={48} />
                  <p>Aucun template disponible</p>
                  <button className="v0-btn-new-template" onClick={navigateToTemplates}>
                    <Plus size={16} />
                    <span>Créer un template</span>
                  </button>
                </div>
              ) : (
                <div className="v0-table-container">
                  <table className="v0-table v0-templates-table">
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th>Description</th>
                        <th>Type d'entreprise</th>
                        <th>Documents</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentData.templates.map((template) => (
                        <tr key={template.id}>
                          <td>{template.titre}</td>
                          <td className="v0-description-cell">{template.description || "Aucune description"}</td>
                          <td>{template.type_entreprise}</td>
                          <td>
                            <div className="v0-documents-count">
                              <span>{(template.documents || []).length}</span>
                              {(template.documents || []).length > 0 && (
                                <button
                                  className="v0-btn v0-btn-icon"
                                  title="Voir les documents"
                                  onClick={() => handleViewDocuments(template)}
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(template.statut)}>
                              {template.statut === "validé"
                                ? "Validé"
                                : template.statut === "rejeté"
                                  ? "Rejeté"
                                  : "En attente"}
                            </span>
                          </td>
                          <td>
                            <div className="v0-action-buttons">
                              <button
                                className="v0-btn v0-btn-outline v0-btn-sm v0-btn-edit"
                                title="Modifier"
                                onClick={() => handleEditTemplate(template.id)}
                              >
                                <Edit size={16} className="v0-edit-icon" />
                              </button>
                              <button
                                className="v0-btn v0-btn-danger v0-btn-sm"
                                title="Supprimer"
                                onClick={() => navigateToTemplates()}
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
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
