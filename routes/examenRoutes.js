const express = require("express");
const router = express.Router();
const examController = require("../controllers/examenController");

// ---------- CREATE ----------
router.post("/create", examController.createExamen);

// ---------- READ ----------
router.get("/getAll", examController.getAllExamens);
router.get("/getById/:id", examController.getExamenById);

// ---------- UPDATE ----------
router.put("/update/:id", examController.updateExamen);

// ---------- DELETE ----------
router.delete("/delete/:id", examController.deleteExamen);

module.exports = router;
