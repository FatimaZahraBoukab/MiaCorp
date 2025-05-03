// Ajout des routes API pour la gestion des templates par les experts

import { Router } from "express"
import { authenticateToken, isExpert } from "../middleware/auth"
import { MongoDB } from "../database"

const router = Router()
const TEMPLATES_COLLECTION = "templates"

// Route pour récupérer tous les templates (pour les experts)
router.get("/expert", authenticateToken, isExpert, async (req, res) => {
  try {
    const db = new MongoDB(TEMPLATES_COLLECTION)
    const templates = await db.read_all()
    res.json(templates)
  } catch (error) {
    res.status(500).json({ detail: `Erreur serveur: ${error.message}` })
  }
})

// Route pour valider un template
router.put("/:template_id/validate", authenticateToken, isExpert, async (req, res) => {
  try {
    const { template_id } = req.params
    const { commentaires } = req.body

    const db = new MongoDB(TEMPLATES_COLLECTION)
    const template = await db.get_by_id(template_id)

    if (!template) {
      return res.status(404).json({ detail: "Template non trouvé" })
    }

    // Mettre à jour le statut du template
    const updatedTemplate = {
      ...template,
      statut: "validé",
      commentaires: commentaires || "",
      expert_id: req.user.id,
      date_validation: new Date().toISOString(),
    }

    const result = await db.update(template_id, updatedTemplate)

    if (!result) {
      return res.status(404).json({ detail: "Échec de la mise à jour du template" })
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ detail: `Erreur serveur: ${error.message}` })
  }
})

// Route pour rejeter un template
router.put("/:template_id/reject", authenticateToken, isExpert, async (req, res) => {
  try {
    const { template_id } = req.params
    const { commentaires } = req.body

    if (!commentaires) {
      return res.status(400).json({ detail: "Un commentaire est requis pour rejeter un template" })
    }

    const db = new MongoDB(TEMPLATES_COLLECTION)
    const template = await db.get_by_id(template_id)

    if (!template) {
      return res.status(404).json({ detail: "Template non trouvé" })
    }

    // Mettre à jour le statut du template
    const updatedTemplate = {
      ...template,
      statut: "rejeté",
      commentaires: commentaires,
      expert_id: req.user.id,
      date_rejet: new Date().toISOString(),
    }

    const result = await db.update(template_id, updatedTemplate)

    if (!result) {
      return res.status(404).json({ detail: "Échec de la mise à jour du template" })
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ detail: `Erreur serveur: ${error.message}` })
  }
})

export default router
