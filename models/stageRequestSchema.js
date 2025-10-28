const mongoose = require("mongoose");

const stageRequestSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  entreprise: { type: String, required: true },
  poste: { type: String, required: true },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  description: String,
  statut: { 
    type: String, 
    required: true, 
    enum: ["en_attente", "approuvee", "rejete"],
    default: "en_attente"
  },
  
  // Relations
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // effectue
  validePar: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // validé par (admin)
}, { timestamps: true });

const StageRequest = mongoose.model("StageRequest", stageRequestSchema);
module.exports = StageRequest;
