// Script à ajouter à votre page pour corriger les formulaires
document.addEventListener("DOMContentLoaded", () => {
  // Fonction pour corriger les formulaires
  function fixForms() {
    // Supprimer tous les textes "Texte libre"
    document.querySelectorAll("p").forEach((p) => {
      if (p.textContent.trim() === "Texte libre") {
        p.style.display = "none"
      }
    })

    // Modifier les types d'input en fonction du nom du champ
    document.querySelectorAll("input").forEach((input) => {
      const name = (input.name || "").toLowerCase()

      // Changer le type d'input en fonction du nom
      if (name.includes("date")) {
        input.type = "date"
      } else if (
        name.includes("montant") ||
        name.includes("capital") ||
        name.includes("nombre") ||
        name.includes("num")
      ) {
        input.type = "number"
      } else if (name.includes("email")) {
        input.type = "email"
      } else if (name.includes("tel") || name.includes("telephone")) {
        input.type = "tel"
      }

      // Ajouter des classes CSS pour le style
      input.classList.add("form-control8")
    })
  }

  // Exécuter la fonction immédiatement
  fixForms()

  // Observer les changements dans le DOM pour appliquer les corrections aux nouveaux éléments
  const observer = new MutationObserver((mutations) => {
    fixForms()
  })

  // Observer tout le document pour les changements
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
})
