const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  score: { type: Number, required: true },
  semestre: { type: String, required: true },
  
  // Relations
  examen: { type: mongoose.Schema.Types.ObjectId, ref: "Examen" }, // issue d’un examen
  cours: { type: mongoose.Schema.Types.ObjectId, ref: "Cours" },   // lié à un cours
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // reçu par un utilisateur
}, { timestamps: true });

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
