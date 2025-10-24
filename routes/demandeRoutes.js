const express = require("express");
const router = express.Router();
const demandeController = require("../controllers/demandeController");

router.post("/create", demandeController.createDemande);
router.get("/getAll", demandeController.getAllDemandes);
router.get("/getById/:id", demandeController.getDemandeById);
router.put("/update/:id", demandeController.updateDemande);
router.delete("/delete/:id", demandeController.deleteDemande);
router.delete("/deleteAll", demandeController.deleteAllDemandes);

module.exports = router;
