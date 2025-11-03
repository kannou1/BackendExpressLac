const express = require("express");
const router = express.Router();
const edtController = require("../controllers/emploiDuTempsController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ➕ Créer un emploi du temps
router.post("/create", requireAuthUser, ControledAcces("admin", "enseignant"), edtController.createEmploiDuTemps);

// 🔍 Récupérer tous les emplois du temps
router.get("/getAll", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), edtController.getAllEmploiDuTemps);

// 🔍 Récupérer un emploi du temps par ID
router.get("/getById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), edtController.getEmploiDuTempsById);

// ✏️ Mettre à jour un emploi du temps
router.put("/update/:id", requireAuthUser, ControledAcces("admin", "enseignant"), edtController.updateEmploiDuTemps);

// ❌ Supprimer un emploi du temps
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin", "enseignant"), edtController.deleteEmploiDuTemps);

// ⚠️ Supprimer tous les emplois du temps
router.delete("/deleteAll", requireAuthUser, ControledAcces("admin"), edtController.deleteAllEmploiDuTemps);

module.exports = router;
