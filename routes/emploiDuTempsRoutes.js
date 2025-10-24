const express = require("express");
const router = express.Router();
const edtController = require("../controllers/emploiDuTempsController");

router.post("/create", edtController.createEmploiDuTemps);
router.get("/getAll", edtController.getAllEmploiDuTemps);
router.get("/getById/:id", edtController.getEmploiDuTempsById);
router.put("/update/:id", edtController.updateEmploiDuTemps);
router.delete("/delete/:id", edtController.deleteEmploiDuTemps);
router.delete("/deleteAll", edtController.deleteAllEmploiDuTemps);

module.exports = router;
