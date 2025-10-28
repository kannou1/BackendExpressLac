const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  statut: { type: String, required: true, enum: ["présent", "absent"] },

  // Relations
  cours: { type: mongoose.Schema.Types.ObjectId, ref: "Cours" }, // suivi dans
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // assiste
}, { timestamps: true });

const Presence = mongoose.model("Presence", presenceSchema);
module.exports = Presence;
