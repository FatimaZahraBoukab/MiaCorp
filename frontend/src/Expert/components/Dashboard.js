import React from "react"
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react"
import "../dashboard-welcome.css"

const Dashboard = ({ stats }) => {
  // Fonction pour obtenir les 3 derniers templates
  const getLatestTemplates = (templates) => {
    if (!templates || !Array.isArray(templates)) return []
    return [...templates].sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation)).slice(0, 3)
  }

  // Fonction pour obtenir le libellé du statut
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

  return React.createElement(
    "div",
    { className: "v5-dashboard-container" },
    // Bannière de bienvenue
    React.createElement(
      "div",
      { className: "v5-welcome-banner" },
      React.createElement(
        "h1",
        { className: "v5-welcome-title" },
        "Bienvenue ",
        React.createElement("span", { role: "img", "aria-label": "wave" }, "👋"),
        " !",
      ),
      React.createElement(
        "p",
        { className: "v5-welcome-subtitle" },
        "Gérez votre projet en toute autonomie depuis votre espace expert.",
      ),
    ),

    // Cartes statistiques
    React.createElement(
      "div",
      { className: "v5-stats-container" },
      React.createElement(
        "div",
        { className: "v5-stat-card" },
        React.createElement(
          "div",
          { className: "v5-stat-icon v5-templates" },
          React.createElement(FileText, { size: 24 }),
        ),
        React.createElement(
          "div",
          { className: "v5-stat-content" },
          React.createElement("div", { className: "v5-stat-value" }, stats.totalTemplates),
          React.createElement("div", { className: "v5-stat-label" }, "Templates disponibles"),
        ),
      ),

      React.createElement(
        "div",
        { className: "v5-stat-card" },
        React.createElement("div", { className: "v5-stat-icon v5-pending" }, React.createElement(Clock, { size: 24 })),
        React.createElement(
          "div",
          { className: "v5-stat-content" },
          React.createElement("div", { className: "v5-stat-value" }, stats.pendingTemplates),
          React.createElement("div", { className: "v5-stat-label" }, "Templates à vérifier"),
        ),
      ),

      React.createElement(
        "div",
        { className: "v5-stat-card" },
        React.createElement(
          "div",
          { className: "v5-stat-icon v5-validated" },
          React.createElement(CheckCircle, { size: 24 }),
        ),
        React.createElement(
          "div",
          { className: "v5-stat-content" },
          React.createElement("div", { className: "v5-stat-value" }, stats.validatedTemplates),
          React.createElement("div", { className: "v5-stat-label" }, "Templates validés"),
        ),
      ),

      React.createElement(
        "div",
        { className: "v5-stat-card" },
        React.createElement(
          "div",
          { className: "v5-stat-icon v5-rejected" },
          React.createElement(XCircle, { size: 24 }),
        ),
        React.createElement(
          "div",
          { className: "v5-stat-content" },
          React.createElement("div", { className: "v5-stat-value" }, stats.rejectedTemplates),
          React.createElement("div", { className: "v5-stat-label" }, "Templates rejetés"),
        ),
      ),
    ),

    // Tableau des derniers templates
    React.createElement(
      "div",
      { className: "v5-templates-container v5-dashboard-templates" },
      React.createElement(
        "div",
        { className: "v5-templates-header" },
        React.createElement(
          "h2",
          { className: "v5-templates-title" },
          React.createElement(FileText, { size: 24 }),
          "Derniers templates",
        ),
        React.createElement(
          "button",
          {
            className: "v5-voir-tout-btn",
            onClick: () => {
              // Changer l'onglet actif pour aller à la page des templates
              if (typeof window !== "undefined") {
                const event = new CustomEvent("changeTab", { detail: { tab: "templates" } })
                window.dispatchEvent(event)
              }
            },
          },
          "Voir tout ",
          React.createElement("span", { className: "v5-voir-tout-arrow" }, "→"),
        ),
      ),
      stats.templates && stats.templates.length > 0
        ? React.createElement(
            "table",
            { className: "v5-templates-table" },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                React.createElement("th", null, "Titre"),
                React.createElement("th", null, "Type d'entreprise"),
                React.createElement("th", null, "Date de création"),
                React.createElement("th", { className: "v5-status-cell" }, "Statut"),
                React.createElement("th", { className: "v5-actions-cell" }, "Actions"),
              ),
            ),
            React.createElement(
              "tbody",
              null,
              getLatestTemplates(stats.templates).map((template) =>
                React.createElement(
                  "tr",
                  { key: template.id },
                  React.createElement("td", null, template.titre),
                  React.createElement("td", null, template.type_entreprise),
                  React.createElement("td", null, new Date(template.date_creation).toLocaleDateString("fr-FR")),
                  React.createElement(
                    "td",
                    { className: "v5-status-cell" },
                    React.createElement(
                      "span",
                      {
                        className: `v5-template-status v5-${template.statut}`,
                      },
                      getStatusLabel(template.statut),
                    ),
                  ),
                  React.createElement(
                    "td",
                    { className: "v5-actions-cell" },
                    React.createElement(
                      "button",
                      {
                        className: "v5-template-action-btn",
                        onClick: () => {
                          // Changer l'onglet actif pour aller à la page des templates
                          if (typeof window !== "undefined") {
                            const event = new CustomEvent("changeTab", { detail: { tab: "templates" } })
                            window.dispatchEvent(event)
                          }
                        },
                      },
                      React.createElement(Eye, { size: 16, className: "v5-action-icon" }),
                    ),
                  ),
                ),
              ),
            ),
          )
        : React.createElement(
            "div",
            { className: "v5-empty-state" },
            React.createElement("p", null, "Aucun template disponible"),
          ),
    ),
  )
}

export default Dashboard
