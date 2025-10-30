const express = require("express");
const router = express.Router();
const demandeController = require("../controllers/demandeController");

// ---------- CREATE ----------
router.post("/create", demandeController.createDemande);

// ---------- READ ----------
router.get("/getAll", demandeController.getAllDemandes);
router.get("/getById/:id", demandeController.getDemandeById);

// ---------- UPDATE ----------
router.put("/update/:id", demandeController.updateDemande);

// ---------- DELETE ----------
router.delete("/delete/:id", demandeController.deleteDemande);
router.delete("/deleteAll", demandeController.deleteAllDemandes);

module.exports = router;
