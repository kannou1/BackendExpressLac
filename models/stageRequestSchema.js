const mongoose = require("mongoose");

const stageRequestSchema = new mongoose.Schema({
  nom: { type: String, required: true },              // e.g., "Stage été 2025"
  entreprise: { type: String, required: true },       // e.g., "TechCorp"
  poste: { type: String, required: true },            // e.g., "Développeur"
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  description: { type: String },                             // link to CV
  statut: { 
    type: String, 
    required: true, 
    enum: ["en_attente", "approuvee", "rejete"],
    default: "en_attente"
  },
  dateCreation: { type: Date, default: Date.now }
}, { timestamps: true });

const StageRequest = mongoose.model("StageRequest", stageRequestSchema);
module.exports = StageRequest;
