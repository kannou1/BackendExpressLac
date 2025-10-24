const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  nom: { type: String, required: true },           // e.g., "Nouvelle note"
  utilisateur: { type: String, required: true },   // recipient name or ID
  message: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ["alerte", "systeme", "rappel"]
  },
  estLu: { type: Boolean, default: false },
  dateCreation: { type: Date, default: Date.now }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
