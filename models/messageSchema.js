const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  nom: { type: String, required: true },             // e.g., "Message 1"
  expediteur: { type: String, required: true },      // sender name or ID
  destinataire: { type: String, required: true },    // recipient name or ID
  contenu: { type: String, required: true },
  estLu: { type: Boolean, default: false },
  horodatage: { type: Date, default: Date.now }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
