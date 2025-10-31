const express = require("express");
const router = express.Router();
const presenceController = require("../controllers/presenceController");

/* ===========================================================
   🟢 ROUTES - PRESENCE
=========================================================== */

// ➕ Créer une présence
router.post("/create", presenceController.createPresence);

// 🔍 Récupérer toutes les présences
router.get("/getAll", presenceController.getAllPresence);

// 🔍 Récupérer une présence par ID
router.get("/getById/:id", presenceController.getPresenceById);

// 🔍 Récupérer toutes les présences d’un étudiant
router.get("/getByEtudiant/:etudiantId", presenceController.getPresenceByEtudiant);

// 🔍 Récupérer toutes les présences d’un enseignant
router.get("/getByEnseignant/:enseignantId", presenceController.getPresenceByEnseignant);

// 🔍 Récupérer toutes les présences d’un cours
router.get("/getByCours/:coursId", presenceController.getPresenceByCours);

// 📊 Taux de présence d’un étudiant (global ou par cours)
router.get("/taux/:etudiantId", presenceController.getTauxPresence);
router.get("/taux/:etudiantId/:coursId", presenceController.getTauxPresence);
// 📚 Taux de présence de tous les étudiants d’un cours
router.get("/taux/cours/:coursId", presenceController.getTauxPresenceByCours);
// ✏️ Mettre à jour une présence
router.put("/update/:id", presenceController.updatePresence);

// ❌ Supprimer une présence
router.delete("/delete/:id", presenceController.deletePresence);

// ⚠️ Supprimer toutes les présences
router.delete("/deleteAll", presenceController.deleteAllPresence);

module.exports = router;
