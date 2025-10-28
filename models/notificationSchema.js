const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, required: true, enum: ["alerte", "systeme", "rappel"] },
  estLu: { type: Boolean, default: false },
  
  // Relations
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // reçoit
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
