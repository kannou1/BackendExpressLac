const express = require("express");
const router = express.Router();
const presenceController = require("../controllers/presenceController");

router.post("/create", presenceController.createPresence);
router.get("/getAll", presenceController.getAllPresence);
router.get("/getById/:id", presenceController.getPresenceById);
router.put("/update/:id", presenceController.updatePresence);
router.delete("/delete/:id", presenceController.deletePresence);
router.delete("/deleteAll", presenceController.deleteAllPresence);

module.exports = router;
