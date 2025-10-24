const express = require("express");
const router = express.Router();
const coursController = require("../controllers/coursController");

router.post("/createCours", coursController.createCours);
router.get("/getAllCours", coursController.getAllCours);
router.get("/getCoursById/:id", coursController.getCoursById);
router.put("/updateCours/:id", coursController.updateCours);
router.delete("/deleteCours/:id", coursController.deleteCours);
router.delete("/deleteAllCours", coursController.deleteAllCours);

module.exports = router;
