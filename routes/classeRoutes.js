const express = require("express");
const router = express.Router();
const classeController = require("../controllers/classeController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ➕ Créer une classe
router.post("/createClasse", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.createClasse);

// 🔍 Récupérer toutes les classes
router.get("/getAllClasses", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), classeController.getAllClasses);

// 🔍 Récupérer une classe par ID
router.get("/getClasseById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), classeController.getClasseById);

// ✏️ Mettre à jour une classe
router.put("/updateClasse/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.updateClasse);

// ❌ Supprimer une classe
router.delete("/deleteClasse/:id", requireAuthUser, ControledAcces("admin"), classeController.deleteClasse);

// ⚠️ Supprimer toutes les classes
router.delete("/deleteAllClasses", requireAuthUser, ControledAcces("admin"), classeController.deleteAllClasses);

module.exports = router;
