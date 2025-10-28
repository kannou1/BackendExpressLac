const mongoose = require("mongoose");

const demandeSchema = new mongoose.Schema({
  nom: { type: String, required: true },
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
  
  // Relations
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // effectue
}, { timestamps: true });

const Demande = mongoose.model("Demande", demandeSchema);
module.exports = Demande;
