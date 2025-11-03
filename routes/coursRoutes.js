const express = require("express");
const router = express.Router();
const coursController = require("../controllers/coursController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ➕ Créer un cours
router.post("/createCours", requireAuthUser, ControledAcces("admin", "enseignant"), coursController.createCours);

// 🔍 Récupérer tous les cours
router.get("/getAllCours", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), coursController.getAllCours);

// 🔍 Récupérer un cours par ID
router.get("/getCoursById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), coursController.getCoursById);

// ✏️ Mettre à jour un cours
router.put("/updateCours/:id", requireAuthUser, ControledAcces("admin", "enseignant"), coursController.updateCours);

// ❌ Supprimer un cours
router.delete("/deleteCours/:id", requireAuthUser, ControledAcces("admin"), coursController.deleteCours);

// ⚠️ Supprimer tous les cours
router.delete("/deleteAllCours", requireAuthUser, ControledAcces("admin"), coursController.deleteAllCours);

module.exports = router;
