const mongoose = require("mongoose");

const emploiDuTempsSchema = new mongoose.Schema({
  jourSemaine: { type: String, required: true },
  heureDebut: { type: String, required: true },
  heureFin: { type: String, required: true },
  salle: { type: String, required: true },

  // ✅ Relation directe à la classe
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe", required: true },

  // ✅ Cours appartenant à cette classe
  cours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cours" }],
}, { timestamps: true });

const EmploiDuTemps = mongoose.model("EmploiDuTemps", emploiDuTempsSchema);
module.exports = EmploiDuTemps;
