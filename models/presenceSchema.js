const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  cours:String,        // e.g., "Présence Math S1"
  date: { type: Date, required: true },         // date of the presence
  statut: { type: String, required: true, enum: ["présent", "absent"] } // status
}, { timestamps: true });

const Presence = mongoose.model("Presence", presenceSchema);
module.exports = Presence;
