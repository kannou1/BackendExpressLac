const Examen = require("../models/examenSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");

/* ===========================================================
   🟢 CREATE EXAM
=========================================================== */
module.exports.createExamen = async (req, res) => {
  try {
    const { nom, type, date, noteMax, description, coursId, enseignantId, classeId } = req.body;

    if (!nom || !type || !date || !noteMax || !coursId) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas remplis." });
    }

    // Vérifier le cours
    const cours = await Cours.findById(coursId);
    if (!cours) return res.status(404).json({ message: "Cours introuvable." });

    // Vérifier enseignant
    let enseignant = null;
    if (enseignantId) {
      enseignant = await User.findById(enseignantId);
      if (!enseignant || enseignant.role !== "enseignant") {
        return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });
      }
    }

    // Vérifier classe
    let classe = null;
    if (classeId) {
      classe = await Classe.findById(classeId);
      if (!classe) return res.status(404).json({ message: "Classe introuvable." });
    }

    // ✅ Créer l’examen
    const newExam = new Examen({
      nom,
      type,
      date,
      noteMax,
      description,
      coursId,
      enseignantId,
      classeId,
    });

    await newExam.save();

    // 🔹 Lier aux entités concernées
    await Cours.findByIdAndUpdate(coursId, { $addToSet: { examens: newExam._id } });
    if (classe) await Classe.findByIdAndUpdate(classeId, { $addToSet: { examens: newExam._id } });
    if (enseignant) await User.findByIdAndUpdate(enseignantId, { $addToSet: { examens: newExam._id } });

    res.status(201).json({ message: "Examen créé avec succès ✅", examen: newExam });
  } catch (error) {
    console.error("❌ Erreur createExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL EXAMS
=========================================================== */
module.exports.getAllExamens = async (_, res) => {
  try {
    const examens = await Examen.find()
      .populate("coursId", "nom code")
      .populate("enseignantId", "nom prenom email")
      .populate("classeId", "nom annee specialisation");

    res.status(200).json(examens);
  } catch (error) {
    console.error("❌ Erreur getAllExamens:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET EXAM BY ID
=========================================================== */
module.exports.getExamenById = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id)
      .populate("coursId", "nom code")
      .populate("enseignantId", "nom prenom email")
      .populate("classeId", "nom annee specialisation");

    if (!examen) return res.status(404).json({ message: "Examen introuvable." });
    res.status(200).json(examen);
  } catch (error) {
    console.error("❌ Erreur getExamenById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE EXAM
=========================================================== */
module.exports.updateExamen = async (req, res) => {
  try {
    const updatedExam = await Examen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedExam) return res.status(404).json({ message: "Examen introuvable." });

    res.status(200).json({ message: "Examen mis à jour ✅", examen: updatedExam });
  } catch (error) {
    console.error("❌ Erreur updateExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE EXAM
=========================================================== */
module.exports.deleteExamen = async (req, res) => {
  try {
    const deletedExam = await Examen.findByIdAndDelete(req.params.id);
    if (!deletedExam) return res.status(404).json({ message: "Examen introuvable." });

    // 🔹 Retirer les références dans les entités associées
    await Promise.all([
      Cours.updateMany({}, { $pull: { examens: deletedExam._id } }),
      Classe.updateMany({}, { $pull: { examens: deletedExam._id } }),
      User.updateMany({}, { $pull: { examens: deletedExam._id } }),
    ]);

    res.status(200).json({ message: "Examen supprimé avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
