const mongoose = require("mongoose");

const examenSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ["examen", "ds", "test"], 
    default: "examen" 
  },
  date: { type: Date, required: true },
  noteMax: { 
    type: Number, 
    required: true, 
    min: [1, "La note maximale doit être positive."] 
  },
  description: { type: String, trim: true },

  // Relations
  coursId: { type: mongoose.Schema.Types.ObjectId, ref: "Cours", required: true },
  enseignantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // prof qui crée l'examen
  classeId: { type: mongoose.Schema.Types.ObjectId, ref: "Classe" }, // classe concernée
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],

}, { timestamps: true });

module.exports = mongoose.model("Examen", examenSchema);
