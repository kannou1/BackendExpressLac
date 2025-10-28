const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  contenu: { type: String, required: true },
  estLu: { type: Boolean, default: false },
  
  // Relations
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
