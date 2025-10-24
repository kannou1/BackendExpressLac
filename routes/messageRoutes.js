const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/create", messageController.createMessage);
router.get("/getAll", messageController.getAllMessages);
router.get("/getById/:id", messageController.getMessageById);
router.put("/update/:id", messageController.updateMessage);
router.delete("/delete/:id", messageController.deleteMessage);
router.delete("/deleteAll", messageController.deleteAllMessages);

module.exports = router;
