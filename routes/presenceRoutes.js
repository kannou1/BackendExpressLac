const express = require("express");
const router = express.Router();
const presenceController = require("../controllers/presenceController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// Créer une présence
router.post("/create", requireAuthUser, ControledAcces("admin", "enseignant"), presenceController.createPresence);

// Récupérer toutes les présences
router.get("/getAll", requireAuthUser, ControledAcces("admin"), presenceController.getAllPresence);

// Récupérer une présence par ID
router.get("/getById/:id", requireAuthUser, ControledAcces("admin", "enseignant"), presenceController.getPresenceById);

// Récupérer toutes les présences d’un étudiant
router.get("/getByEtudiant/:etudiantId", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), presenceController.getPresenceByEtudiant);

// Récupérer toutes les présences d’un enseignant
router.get("/getByEnseignant/:enseignantId", requireAuthUser, ControledAcces("admin"), presenceController.getPresenceByEnseignant);

// Récupérer toutes les présences d’un cours
router.get("/getByCours/:coursId", requireAuthUser, ControledAcces("admin", "enseignant"), presenceController.getPresenceByCours);

// Taux de présence d’un étudiant (tous les cours)
router.get("/taux/etudiant/:etudiantId", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), presenceController.getTauxPresence);

// Taux de présence d’un étudiant pour un cours précis
router.get("/taux/etudiant/:etudiantId/cours/:coursId", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), presenceController.getTauxPresence);

// Taux de présence global d’un cours
router.get("/taux/cours/:coursId", requireAuthUser, ControledAcces("admin", "enseignant"), presenceController.getTauxPresenceParCours);

// Mettre à jour une présence
router.put("/update/:id", requireAuthUser, ControledAcces("admin", "enseignant"), presenceController.updatePresence);

// Supprimer une présence
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin"), presenceController.deletePresence);

// Supprimer toutes les présences
router.delete("/deleteAll", requireAuthUser, ControledAcces("admin"), presenceController.deleteAllPresence);

module.exports = router;
