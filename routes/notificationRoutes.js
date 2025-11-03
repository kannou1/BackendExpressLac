const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

/* ===========================================================
   🔔 ROUTES NOTIFICATIONS
=========================================================== */

// 🟢 Créer une notification
router.post("/", notificationController.createNotification);

// 🔍 Récupérer toutes les notifications
router.get("/", notificationController.getAllNotifications);

// 🔍 Récupérer les notifications d’un utilisateur
router.get("/user/:userId", notificationController.getNotificationsByUser);

// ✏️ Marquer une notification comme lue
router.put("/:id/read", notificationController.markAsRead);

// ❌ Supprimer une notification
router.delete("/:id", notificationController.deleteNotification);

// 🧹 Supprimer toutes les notifications d’un utilisateur
router.delete("/user/:userId", notificationController.deleteAllNotificationsOfUser);

module.exports = router;
