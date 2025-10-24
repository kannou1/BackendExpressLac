const express = require("express");
const router = express.Router();
const classeController = require("../controllers/classeController");

router.post("/createClasse", classeController.createClasse);
router.get("/getAllClasses", classeController.getAllClasses);
router.get("/getClasseById/:id", classeController.getClasseById);
router.put("/updateClasse/:id", classeController.updateClasse);
router.delete("/deleteClasse/:id", classeController.deleteClasse);
router.delete("/deleteAllClasses", classeController.deleteAllClasses);

module.exports = router;
