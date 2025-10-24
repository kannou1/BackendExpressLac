const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.post("/create", notificationController.createNotification);
router.get("/getAll", notificationController.getAllNotifications);
router.get("/getById/:id", notificationController.getNotificationById);
router.put("/update/:id", notificationController.updateNotification);
router.delete("/delete/:id", notificationController.deleteNotification);
router.delete("/deleteAll", notificationController.deleteAllNotifications);

module.exports = router;
