const express = require("express");
const router = express.Router();
const demandeController = require("../controllers/demandeController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ➕ Créer une demande
router.post("/create", requireAuthUser, ControledAcces("etudiant", "enseignant", "admin"), demandeController.createDemande);

// 🔍 Récupérer toutes les demandes
router.get("/getAll", requireAuthUser, ControledAcces("admin", "enseignant"), demandeController.getAllDemandes);

// 🔍 Récupérer une demande par ID
router.get("/getById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), demandeController.getDemandeById);

// ✏️ Mettre à jour une demande
router.put("/update/:id", requireAuthUser, ControledAcces("admin", "enseignant"), demandeController.updateDemande);

// ❌ Supprimer une demande
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin", "enseignant"), demandeController.deleteDemande);

// ⚠️ Supprimer toutes les demandes
router.delete("/deleteAll", requireAuthUser, ControledAcces("admin"), demandeController.deleteAllDemandes);

module.exports = router;
