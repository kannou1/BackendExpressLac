const mongoose = require("mongoose");

const examenSchema = new mongoose.Schema({
  nom: { type: String, required: true },        // e.g., "Math Partiel 1"
  type: { 
    type: String, 
    required: true, 
    enum: ["examen", "ds", "test"],       // only these 3 values
    
  },
  date: { type: Date, required: true },
  noteMax: { type: Number, required: true },
  description: { type: String }
}, { timestamps: true });

const Examen = mongoose.model("Examen", examenSchema);
module.exports = Examen;
