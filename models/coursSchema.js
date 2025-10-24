const mongoose = require("mongoose");

const coursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  credits: { type: Number, required: true },
  semestre: { type: String, required: true },
}, { timestamps: true });

const Cours = mongoose.model("Cours", coursSchema);
module.exports = Cours;
