const Note = require("../models/noteSchema");
const User = require("../models/userSchema");
const Examen = require("../models/examenSchema");

/* ===========================================================
   🟢 CREATE NOTE
=========================================================== */
module.exports.createNote = async (req, res) => {
  try {
    const { score, examen, etudiant, enseignant } = req.body;

    // Validation basique
    if (!score || !examen || !etudiant || !enseignant) {
      return res.status(400).json({ message: "Score, examen, étudiant et enseignant sont obligatoires." });
    }

    // Vérification des entités
    const [etudiantData, enseignantData, examenData] = await Promise.all([
      User.findById(etudiant),
      User.findById(enseignant),
      Examen.findById(examen),
    ]);

    if (!etudiantData) return res.status(404).json({ message: "Étudiant introuvable." });
    if (!enseignantData || enseignantData.role !== "enseignant")
      return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });
    if (!examenData) return res.status(404).json({ message: "Examen introuvable." });

    // ✅ Création de la note
    const newNote = new Note({
      score,
      examen,
      etudiant,
      enseignant,
    });

    await newNote.save();

    // 🔗 Ajout des références bidirectionnelles
    await Promise.all([
      User.findByIdAndUpdate(etudiant, { $addToSet: { notes: newNote._id } }),
      User.findByIdAndUpdate(enseignant, { $addToSet: { notes: newNote._id } }),
      Examen.findByIdAndUpdate(examen, { $addToSet: { notes: newNote._id } }),
    ]);

    res.status(201).json({ message: "Note ajoutée avec succès ✅", note: newNote });
  } catch (error) {
    console.error("❌ Erreur createNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL NOTES
=========================================================== */
module.exports.getAllNotes = async (_, res) => {
  try {
    const notes = await Note.find()
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "examen",
        select: "nom type date noteMax",
        populate: { path: "coursId", select: "nom code credits semestre" },
      });

    res.status(200).json(notes);
  } catch (error) {
    console.error("❌ Erreur getAllNotes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET NOTE BY ID
=========================================================== */
module.exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "examen",
        select: "nom type date noteMax",
        populate: { path: "coursId", select: "nom code credits semestre" },
      });

    if (!note) return res.status(404).json({ message: "Note introuvable." });
    res.status(200).json(note);
  } catch (error) {
    console.error("❌ Erreur getNoteById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE NOTE
=========================================================== */
module.exports.updateNote = async (req, res) => {
  try {
    const updated = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Note introuvable." });

    res.status(200).json({ message: "Note mise à jour ✅", note: updated });
  } catch (error) {
    console.error("❌ Erreur updateNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE NOTE
=========================================================== */
module.exports.deleteNote = async (req, res) => {
  try {
    const deleted = await Note.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Note introuvable." });

    // 🔹 Retirer les références dans les autres entités
    await Promise.all([
      User.updateMany({}, { $pull: { notes: deleted._id } }),
      Examen.updateMany({}, { $pull: { notes: deleted._id } }),
    ]);

    res.status(200).json({ message: "Note supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
