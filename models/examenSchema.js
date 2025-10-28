const mongoose = require("mongoose");

const examenSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  type: { type: String, required: true, enum: ["examen", "ds", "test"] },
  date: { type: Date, required: true },
  noteMax: { type: Number, required: true },
  description: String,

  // Relations
  cours: { type: mongoose.Schema.Types.ObjectId, ref: "Cours" }, // appartient à un cours
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }], // produit
}, { timestamps: true });

const Examen = mongoose.model("Examen", examenSchema);
module.exports = Examen;
