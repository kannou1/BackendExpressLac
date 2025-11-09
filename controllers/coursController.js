// 📘 controllers/coursController.js
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const EmploiDuTemps = require("../models/emploiDuTempsSchema");

// ------------------- CREATE -------------------
module.exports.createCours = async (req, res) => {
  try {
    const { nom, code, description, credits, semestre, classe, enseignant } = req.body;

    // 🔹 Vérifier unicité du code
    const existingCours = await Cours.findOne({ code });
    if (existingCours)
      return res.status(400).json({ message: "Le code du cours doit être unique." });

    // 🔹 Vérifier que la classe existe
    const foundClasse = await Classe.findById(classe);
    if (!foundClasse)
      return res.status(404).json({ message: "Classe introuvable." });

    // 🔹 Vérifier que l’enseignant existe (facultatif)
    let foundEnseignant = null;
    if (enseignant) {
      foundEnseignant = await User.findById(enseignant);
      if (!foundEnseignant || foundEnseignant.role !== "enseignant") {
        return res.status(404).json({ message: "Enseignant introuvable ou invalide." });
      }
    }

    // 🔹 Créer le cours
    const newCours = new Cours({
      nom,
      code,
      description,
      credits,
      semestre,
      classe,
      enseignant,
    });
    await newCours.save();

    // 🔹 Ajouter le cours dans la classe
    foundClasse.cours.push(newCours._id);
    await foundClasse.save();

    // 🔹 Ajouter le cours dans l’enseignant
    if (foundEnseignant) {
      foundEnseignant.coursEnseignes.push(newCours._id);
      await foundEnseignant.save();
    }

    res.status(201).json({
      message: "Cours créé et lié avec succès ✅",
      newCours,
    });
  } catch (error) {
    console.error("❌ Erreur createCours:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- GET ALL -------------------

module.exports.getAllCours = async (req, res) => {
  try {
    let cours = [];

    // Si c’est un étudiant : afficher les cours de sa classe
    if (req.user.role === "etudiant") {
      const etudiant = await User.findById(req.user.id).populate("classe", "_id nom");
      if (!etudiant || !etudiant.classe) {
        return res.status(404).json({ message: "Classe de l’étudiant introuvable." });
      }

      cours = await Cours.find({ classe: etudiant.classe._id })
        .populate("classe", "nom annee specialisation anneeAcademique")
        .populate("enseignant", "prenom nom email specialite")
        .populate({
          path: "examens",
          populate: { path: "notes", select: "valeur etudiant" },
        })
        .populate("presences", "date statut etudiant")
        .populate("emplois", "jour heureDebut heureFin salle");

    }
    // Si c’est un enseignant : afficher uniquement les cours qu’il enseigne
    else if (req.user.role === "enseignant") {
      cours = await Cours.find({ enseignant: req.user.id })
        .populate("classe", "nom annee specialisation anneeAcademique")
        .populate("enseignant", "prenom nom email specialite")
        .populate({
          path: "examens",
          populate: { path: "notes", select: "valeur etudiant" },
        })
        .populate("presences", "date statut etudiant")
        .populate("emplois", "jour heureDebut heureFin salle");
    }
    // Si c’est un admin : afficher tous les cours
    else {
      cours = await Cours.find()
        .populate("classe", "nom annee specialisation anneeAcademique")
        .populate("enseignant", "prenom nom email specialite")
        .populate({
          path: "examens",
          populate: { path: "notes", select: "valeur etudiant" },
        })
        .populate("presences", "date statut etudiant")
        .populate("emplois", "jour heureDebut heureFin salle");
    }

    res.status(200).json(cours);
  } catch (error) {
    console.error("❌ Erreur getAllCours:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- GET BY ID -------------------
module.exports.getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id)
      .populate("classe", "nom annee specialisation anneeAcademique")
      .populate("enseignant", "prenom nom email specialite")
      .populate({
        path: "examens",
        populate: { path: "notes", select: "valeur etudiant" },
      })
      .populate("presences", "date statut etudiant")
      .populate("emplois", "jour heureDebut heureFin salle");

    if (!cours) return res.status(404).json({ message: "Cours introuvable." });

    res.status(200).json(cours);
  } catch (error) {
    console.error("❌ Erreur getCoursById:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------- UPDATE -------------------
module.exports.updateCours = async (req, res) => {
  try {
    const { id } = req.params;
    const { classe, enseignant, ...updateData } = req.body;

    const cours = await Cours.findById(id);
    if (!cours) return res.status(404).json({ message: "Cours introuvable." });

    // ⚙️ Gérer changement de classe
    if (classe && classe.toString() !== cours.classe?.toString()) {
      await Classe.updateOne({ _id: cours.classe }, { $pull: { cours: cours._id } });
      await Classe.updateOne({ _id: classe }, { $addToSet: { cours: cours._id } });
      updateData.classe = classe;
    }

    // ⚙️ Gérer changement d’enseignant
    if (enseignant && enseignant.toString() !== cours.enseignant?.toString()) {
      await User.updateOne({ _id: cours.enseignant }, { $pull: { coursEnseignes: cours._id } });
      await User.updateOne({ _id: enseignant }, { $addToSet: { coursEnseignes: cours._id } });
      updateData.enseignant = enseignant;
    }

    const updatedCours = await Cours.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: "Cours mis à jour avec succès ✅",
      updatedCours,
    });
  } catch (error) {
    console.error("❌ Erreur updateCours:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- DELETE -------------------
module.exports.deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) return res.status(404).json({ message: "Cours introuvable." });

    // 🧹 Supprimer le cours de la classe
    await Classe.updateOne({ _id: cours.classe }, { $pull: { cours: cours._id } });

    // 🧹 Supprimer le cours de l’enseignant
    await User.updateOne({ _id: cours.enseignant }, { $pull: { coursEnseignes: cours._id } });

    // 🧹 Supprimer le cours lui-même
    await Cours.findByIdAndDelete(req.params.id);
    //await Examen.deleteMany({ cours: cours._id });
    //await Presence.deleteMany({ cours: cours._id });
     await EmploiDuTemps.updateMany({}, { $pull: { cours: cours._id } });

    res.status(200).json({ message: "Cours supprimé avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteCours:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- DELETE ALL -------------------
module.exports.deleteAllCours = async (req, res) => {
  try {
    await Cours.deleteMany({});
    await Classe.updateMany({}, { $set: { cours: [] } });
    await User.updateMany({ role: "enseignant" }, { $set: { coursEnseignes: [] } });
    //await Examen.deleteMany({ cours: cours._id });
    //await Presence.deleteMany({ cours: cours._id });
    await EmploiDuTemps.updateMany({}, { $pull: { cours: cours._id } });

    res.status(200).json({ message: "Tous les cours ont été supprimés ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllCours:", error);
    res.status(500).json({ message: error.message });
  }
};

