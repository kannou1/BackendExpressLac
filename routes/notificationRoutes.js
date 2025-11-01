const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// ➕ Créer une notification
router.post("/create", notificationController.createNotification);

// 🔍 Toutes les notifications
router.get("/getAll", notificationController.getAllNotifications);

// 🔍 Notifications d’un utilisateur
router.get("/user/:userId", notificationController.getNotificationsByUser);

// ✏️ Marquer comme lue
router.put("/read/:id", notificationController.markAsRead);

// ❌ Supprimer une notification
router.delete("/delete/:id", notificationController.deleteNotification);

module.exports = router;
