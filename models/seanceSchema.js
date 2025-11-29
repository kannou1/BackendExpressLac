const mongoose = require("mongoose");

const seanceSchema = new mongoose.Schema({
  // Schedule info
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  jourSemaine: {
    type: String,
    enum: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    required: true
  },
  heureDebut: { type: String, required: true }, // "08:00"
  heureFin: { type: String, required: true },   // "10:00"

  // Location & Type
  salle: { type: String, required: true },
  typeCours: {
    type: String,
    enum: ["Cours Magistral", "TD", "TP", "Exam", "Conference"],
    required: true
  },

  // Relations
  cours: { type: mongoose.Schema.Types.ObjectId, ref: "Cours", required: true },
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe", required: true },
  emploiDuTemps: { type: mongoose.Schema.Types.ObjectId, ref: "EmploiDuTemps", required: true },

  // Optional
  notes: { type: String },
  statut: { type: String, enum: ["planifie", "annule", "reporte"], default: "planifie" },
}, { timestamps: true });

const Seance = mongoose.model("Seance", seanceSchema);
module.exports = Seance;
