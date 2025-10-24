const mongoose = require("mongoose");

const classeSchema = new mongoose.Schema({
  nom: { type: String, required: true , unique: true },
  annee: { type: Number, required: true },
  specialisation: { type: String, required: true },
  anneeAcademique: { type: String, required: true },
}, { timestamps: true });

const Classe = mongoose.model("Classe", classeSchema);
module.exports = Classe;
