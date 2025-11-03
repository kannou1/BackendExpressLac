const express = require("express");
const router = express.Router();
const examController = require("../controllers/examenController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ➕ Créer un examen
router.post("/create", requireAuthUser, ControledAcces("admin", "enseignant"), examController.createExamen);

// 🔍 Récupérer tous les examens
router.get("/getAll", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), examController.getAllExamens);

// 🔍 Récupérer un examen par ID
router.get("/getById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), examController.getExamenById);

// ✏️ Mettre à jour un examen
router.put("/update/:id", requireAuthUser, ControledAcces("admin", "enseignant"), examController.updateExamen);

// ❌ Supprimer un examen
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin", "enseignant"), examController.deleteExamen);

module.exports = router;
