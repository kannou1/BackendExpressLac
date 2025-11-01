const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const upload = require("../middlewares/uploadfile");

// ➕ Envoyer un message (texte ou image)
router.post("/send", upload.single("image"), messageController.sendMessage);

// 🔍 Récupérer la conversation entre 2 utilisateurs
router.get("/conversation/:userId1/:userId2", messageController.getConversation);

// 🔍 Récupérer tous les messages (admin)
router.get("/all", messageController.getAllMessages);

// ✏️ Modifier un message
router.put("/update/:id", messageController.updateMessage);

// ❌ Supprimer un message
router.delete("/delete/:id", messageController.deleteMessage);

// ⚠️ Supprimer tous les messages
router.delete("/deleteAll", messageController.deleteAllMessages);

module.exports = router;
