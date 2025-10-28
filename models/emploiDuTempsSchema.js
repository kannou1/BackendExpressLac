const mongoose = require("mongoose");

const emploiDuTempsSchema = new mongoose.Schema({
  jourSemaine: { type: String, required: true },
  heureDebut: { type: String, required: true },
  heureFin: { type: String, required: true },
  salle: { type: String, required: true },

  // Relations
  cours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cours" }], // planifié dans
}, { timestamps: true });

const EmploiDuTemps = mongoose.model("EmploiDuTemps", emploiDuTempsSchema);
module.exports = EmploiDuTemps;
