const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  nom: { type: String, required: true },           // e.g., "Partiel 1"
  cours: { type: String, required: true },         // e.g., "Mathématiques"
  type: { 
    type: String, 
    required: true, 
    enum: ["examen", "devoir", "projet"],          // only these 3 types
    message: "Type must be either 'examen', 'devoir', or 'projet'"
  },
  score: { type: Number, required: true },         // e.g., 15
  semestre: { type: String, required: true }       // e.g., "S1"
}, { timestamps: true });

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
