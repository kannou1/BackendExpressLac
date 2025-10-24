const mongoose = require("mongoose");

const demandeSchema = new mongoose.Schema({
  nom: { type: String, required: true },           // e.g., "Attestation de présence"
  type: { 
    type: String, 
    required: true, 
    enum: ["attestation_presence", "inscription", "reussite", "releve"],
  },
  statut: { 
    type: String, 
    required: true, 
    enum: ["en_attente", "approuvee", "rejete"],
    default: "en_attente"
  },
  dateCreation: { type: Date, default: Date.now }
}, { timestamps: true });

const Demande = mongoose.model("Demande", demandeSchema);
module.exports = Demande;
