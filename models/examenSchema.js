const mongoose = require("mongoose");

const examenSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },

    type: {
      type: String,
      required: true,
      enum: ["examen", "ds", "test"],
      default: "examen",
    },

    date: { type: Date, required: true },

    noteMax: {
      type: Number,
      required: true,
      min: [1, "La note maximale doit être positive."],
    },

    description: { type: String, trim: true },

    // ✅ Indique si l’examen a été passé ou non
    estPasse: {
      type: Boolean,
      default: false, // au départ non passé
    },

    // Relations
    coursId: { type: mongoose.Schema.Types.ObjectId, ref: "Cours", required: true },
    enseignantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    classeId: { type: mongoose.Schema.Types.ObjectId, ref: "Classe" },
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  },
  { timestamps: true }
);

// 🔄 Optionnel : mise à jour automatique de estPasse selon la date
examenSchema.pre("save", function (next) {
  const now = new Date();
  if (this.date < now && !this.estPasse) {
    this.estPasse = true;
  }
  next();
});

module.exports = mongoose.model("Examen", examenSchema);
