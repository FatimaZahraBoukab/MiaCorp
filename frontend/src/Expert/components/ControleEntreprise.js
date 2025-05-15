"use client"

import React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import { Building2, AlertCircle, RefreshCw, Eye, CheckCircle, XCircle } from "lucide-react"
import "../entreprise-table.css"

const ControleEntrepriseV5 = ({ entreprises: initialEntreprises, fetchEntreprises, setSuccessMsg, setErrorMsg }) => {
  const [selectedEntreprise, setSelectedEntreprise] = useState(null)
  const [comments, setComments] = useState("")
  const [entreprises, setEntreprises] = useState(initialEntreprises || [])
  const [allEntreprises, setAllEntreprises] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

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

      // Essayer d'abord avec le endpoint /all
      try {
        const response = await axios.get("http://localhost:8000/entreprises/all", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAllEntreprises(response.data)
        setIsLoading(false)
      } catch (err) {
        // Si le endpoint /all n'existe pas, essayer avec le endpoint standard
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

  return React.createElement(
    "div",
    { className: "v5-entreprises-container" },
    selectedEntreprise
      ? React.createElement(
          "div",
          { className: "v5-entreprise-detail" },
          React.createElement(
            "div",
            { className: "v5-entreprise-detail-header" },
            React.createElement("h2", null, selectedEntreprise.nom),
            React.createElement(
              "button",
              {
                className: "v5-back-btn",
                onClick: () => setSelectedEntreprise(null),
              },
              "Retour",
            ),
          ),

          React.createElement(
            "div",
            { className: "v5-comparison-grid" },
            React.createElement(
              "div",
              { className: "v5-comparison-column" },
              React.createElement("h3", null, "Informations soumises"),
              React.createElement(
                "div",
                { className: "v5-info-item" },
                React.createElement("strong", null, "Type:"),
                " ",
                selectedEntreprise.type,
              ),
              React.createElement(
                "div",
                { className: "v5-info-item" },
                React.createElement("strong", null, "Date de création:"),
                " ",
                new Date(selectedEntreprise.date_creation).toLocaleDateString("fr-FR"),
              ),
              React.createElement(
                "div",
                { className: "v5-info-item" },
                React.createElement("strong", null, "Statut:"),
                " ",
                React.createElement(
                  "span",
                  {
                    className: `v5-entreprise-status v5-${selectedEntreprise.statut || "en_attente"}`,
                  },
                  getStatusLabel(selectedEntreprise.statut || "en_attente"),
                ),
              ),

              React.createElement("h3", null, "Variables du document"),
              selectedEntreprise.valeurs_variables && Object.keys(selectedEntreprise.valeurs_variables).length > 0
                ? React.createElement(
                    "div",
                    { className: "v5-variables-list" },
                    Object.entries(selectedEntreprise.valeurs_variables).map(([key, value], index) =>
                      React.createElement(
                        "div",
                        { key: index, className: "v5-variable-item" },
                        React.createElement("span", { className: "v5-variable-name" }, key),
                        React.createElement("span", { className: "v5-variable-value" }, value),
                      ),
                    ),
                  )
                : React.createElement("p", null, "Aucune variable disponible"),
            ),

            React.createElement(
              "div",
              { className: "v5-comparison-column" },
              React.createElement("h3", null, "Pièce d'identité"),
              selectedEntreprise.piece_identite
                ? React.createElement(
                    "div",
                    { className: "v5-id-card-container" },
                    React.createElement("img", {
                      src: `data:image/jpeg;base64,${selectedEntreprise.piece_identite.content}`,
                      alt: "Pièce d'identité",
                      className: "v5-id-card-image",
                      onError: (e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?height=300&width=400"
                        console.log("Erreur de chargement de l'image")
                      },
                    }),
                    React.createElement(
                      "div",
                      { className: "v5-id-card-info" },
                      React.createElement(
                        "p",
                        null,
                        "Date d'upload: ",
                        new Date(selectedEntreprise.piece_identite.date_upload).toLocaleDateString("fr-FR"),
                      ),
                    ),
                  )
                : React.createElement("p", null, "Pièce d'identité non disponible"),
            ),
          ),

          React.createElement(
            "div",
            { className: "v5-validation-section" },
            React.createElement("h3", null, "Validation"),
            React.createElement("textarea", {
              value: comments,
              onChange: (e) => setComments(e.target.value),
              placeholder: "Ajoutez vos commentaires ici...",
              rows: 4,
              className: "v5-comments-textarea",
            }),

            React.createElement(
              "div",
              { className: "v5-validation-actions" },
              React.createElement(
                "button",
                {
                  className: "v5-validate-btn",
                  onClick: () => handleValidateEntreprise(selectedEntreprise.id),
                  disabled: selectedEntreprise.statut !== "en_attente",
                },
                React.createElement(CheckCircle, { size: 16, className: "v5-action-icon" }),
                "Valider",
              ),
              React.createElement(
                "button",
                {
                  className: "v5-reject-btn",
                  onClick: () => handleRejectEntreprise(selectedEntreprise.id),
                  disabled: !comments || selectedEntreprise.statut !== "en_attente",
                },
                React.createElement(XCircle, { size: 16, className: "v5-action-icon" }),
                "Rejeter",
              ),
            ),
          ),
        )
      : React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { className: "v5-entreprises-header" },
            React.createElement(
              "h2",
              { className: "v5-entreprises-title" },
              React.createElement(Building2, { size: 24 }),
              "Entreprises",
            ),
            React.createElement(
              "button",
              {
                className: "v5-refresh-btn",
                onClick: fetchAllEntreprises,
                disabled: isLoading,
              },
              React.createElement(RefreshCw, {
                size: 16,
                className: isLoading ? "v5-spin" : "",
              }),
              "Actualiser",
            ),
          ),

          loadError &&
            React.createElement(
              "div",
              { className: "v5-error-banner" },
              React.createElement(AlertCircle, { size: 20 }),
              React.createElement("span", null, loadError),
              React.createElement(
                "button",
                {
                  className: "v5-retry-btn",
                  onClick: fetchAllEntreprises,
                },
                "Réessayer",
              ),
            ),

          isLoading
            ? React.createElement(
                "div",
                { className: "v5-loading-state" },
                React.createElement("div", { className: "v5-spinner" }),
                React.createElement("p", null, "Chargement des entreprises..."),
              )
            : allEntreprises.length === 0 && !loadError
              ? React.createElement(
                  "div",
                  { className: "v5-empty-state" },
                  React.createElement(Building2, { size: 48, className: "v5-empty-icon" }),
                  React.createElement("p", null, "Aucune entreprise trouvée"),
                  React.createElement(
                    "button",
                    {
                      className: "v5-retry-btn",
                      onClick: fetchAllEntreprises,
                    },
                    "Actualiser",
                  ),
                )
              : React.createElement(
                  "table",
                  { className: "v5-entreprises-table" },
                  React.createElement(
                    "thead",
                    null,
                    React.createElement(
                      "tr",
                      null,
                      React.createElement("th", { className: "v5-type-cell", style: { width: "25%" } }, "Type"),
                      React.createElement(
                        "th",
                        { className: "v5-date-cell", style: { width: "25%" } },
                        "Date de création",
                      ),
                      React.createElement("th", { className: "v5-status-cell", style: { width: "25%" } }, "Statut"),
                      React.createElement("th", { className: "v5-actions-cell", style: { width: "25%" } }, "Actions"),
                    ),
                  ),
                  React.createElement(
                    "tbody",
                    null,
                    allEntreprises.map((entreprise) =>
                      React.createElement(
                        "tr",
                        { key: entreprise.id },
                        React.createElement("td", null, entreprise.type),
                        React.createElement("td", null, new Date(entreprise.date_creation).toLocaleDateString("fr-FR")),
                        React.createElement(
                          "td",
                          { className: "v5-status-cell" },
                          React.createElement(
                            "span",
                            {
                              className: `v5-entreprise-status v5-${entreprise.statut || "en_attente"}`,
                            },
                            getStatusLabel(entreprise.statut || "en_attente"),
                          ),
                        ),
                        React.createElement(
                          "td",
                          { className: "v5-actions-cell" },
                          React.createElement(
                            "button",
                            {
                              className: "v5-entreprise-action-btn",
                              onClick: () => handleSelectEntreprise(entreprise.id),
                            },
                            React.createElement(Eye, { size: 16, className: "v5-action-icon" }),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
        ),
  )
}

export default ControleEntrepriseV5
