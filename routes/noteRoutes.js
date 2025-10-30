const express = require("express");
const router = express.Router();
const noteController = require("../controllers/noteController");

// ===========================================================
// 🟢 CRUD des Notes
// ===========================================================

// ➕ Créer une note
router.post("/create", noteController.createNote);

// 🔍 Récupérer toutes les notes
router.get("/get", noteController.getAllNotes);

// 🔍 Récupérer une note par ID
router.get("/getById/:id", noteController.getNoteById);

// ✏️ Mettre à jour une note
router.put("/updateById/:id", noteController.updateNote);

// ❌ Supprimer une note
router.delete("/delete/:id", noteController.deleteNote);

module.exports = router;
