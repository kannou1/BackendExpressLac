const express = require("express");
const router = express.Router();
const noteController = require("../controllers/noteController");

router.post("/create", noteController.createNote);
router.get("/getAll", noteController.getAllNotes);
router.get("/getById/:id", noteController.getNoteById);
router.put("/update/:id", noteController.updateNote);
router.delete("/delete/:id", noteController.deleteNote);
router.delete("/deleteAll", noteController.deleteAllNotes);

module.exports = router;
