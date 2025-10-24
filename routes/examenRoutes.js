const express = require("express");
const router = express.Router();
const examenController = require("../controllers/examenController");

router.post("/create", examenController.createExamen);
router.get("/getAll", examenController.getAllExamen);
router.get("/getById/:id", examenController.getExamenById);
router.put("/update/:id", examenController.updateExamen);
router.delete("/delete/:id", examenController.deleteExamen);
router.delete("/deleteAll", examenController.deleteAllExamen);

module.exports = router;
