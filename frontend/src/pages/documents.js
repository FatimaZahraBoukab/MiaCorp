import { Router } from "express"
import { authenticateToken, isExpert } from "../middleware/auth"
import { CouchDB } from "../database"

const router = Router()
const DOCUMENTS_COLLECTION = "documents"

// Route pour récupérer un document (pièce d'identité)
router.get("/:document_id", authenticateToken, isExpert, async (req, res) => {
  try {
    const { document_id } = req.params
    const db = new CouchDB(DOCUMENTS_COLLECTION)

    const document = await db.get_by_id(document_id)

    if (!document) {
      return res.status(404).json({ detail: "Document non trouvé" })
    }

    // Vérifier si c'est une pièce d'identité
    if (document.type !== "piece_identite") {
      return res.status(400).json({ detail: "Ce document n'est pas une pièce d'identité" })
    }

    // Convertir le contenu en Buffer pour l'envoyer
    const contentBuffer = Buffer.from(document.content, "latin1")

    // Définir les en-têtes pour l'image
    res.setHeader("Content-Type", "application/octet-stream")
    res.setHeader("Content-Disposition", `inline; filename="piece_identite_${document_id}.jpg"`)

    // Envoyer le contenu
    res.send(contentBuffer)
  } catch (error) {
    console.error("Erreur lors de la récupération du document:", error)
    res.status(500).json({ detail: `Erreur serveur: ${error.message}` })
  }
})

export default router
