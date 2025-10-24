const mongoose = require("mongoose");

const emploiDuTempsSchema = new mongoose.Schema({
  cours:String,
  classe: String,
  enseignant: String,
  jourSemaine: { type: String, required: true },  // e.g., "Lundi"
  heureDebut: { type: String, required: true },   // e.g., "08:00"
  heureFin: { type: String, required: true },     // e.g., "10:00"
  salle: { type: String, required: true }
}, { timestamps: true });

const EmploiDuTemps = mongoose.model("EmploiDuTemps", emploiDuTempsSchema);
module.exports = EmploiDuTemps;
