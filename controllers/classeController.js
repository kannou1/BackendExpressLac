const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Cours = require("../models/coursSchema");

// 🟢 Create
module.exports.createClasse = async (req, res) => {
  try {
    const newClasse = await Classe.create(req.body);
    res.status(201).json({
      message: "Classe créée avec succès ✅",
      classe: newClasse,
    });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// 🔵 Get All
module.exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Classe.find()
      .populate("cours", "nom code semestre credits")
      .populate("etudiants", "prenom nom email")
      .populate("enseignants", "prenom nom email specialite");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟡 Get by ID
module.exports.getClasseById = async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id)
      .populate({
        path: "cours",
        select: "nom code semestre",
        populate: {
          path: "emplois",
          select: "jourSemaine heureDebut heureFin salle",
        },
      })
      .populate("etudiants", "prenom nom email")
      .populate("enseignants", "prenom nom email");

    if (!classe)
      return res.status(404).json({ message: "Classe introuvable" });

    res.status(200).json({
      message: "Classe trouvée ✅",
      classe,
    });
  } catch (error) {
    console.error("❌ Erreur getClasseById:", error);
    res.status(500).json({ message: error.message });
  }
};


// 🟠 Update (avec mise à jour des relations)
module.exports.updateClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // 🔹 Mise à jour simple des champs
    Object.assign(classe, updateData);
    await classe.save();

    // 🔹 Synchronisation relations enseignants
    if (updateData.enseignants) {
      // Supprimer la classe des anciens enseignants
      await User.updateMany(
        { _id: { $in: classe.enseignants } },
        { $pull: { classes: classe._id } }
      );

      // Ajouter la classe aux nouveaux enseignants
      await User.updateMany(
        { _id: { $in: updateData.enseignants } },
        { $addToSet: { classes: classe._id } }
      );
    }

    // 🔹 Synchronisation relations étudiants
    if (updateData.etudiants) {
      // Retirer la classe des anciens étudiants
      await User.updateMany(
        { _id: { $in: classe.etudiants } },
        { $unset: { classe: "" } }
      );

      // Ajouter la classe aux nouveaux étudiants
      await User.updateMany(
        { _id: { $in: updateData.etudiants } },
        { $set: { classe: classe._id } }
      );
    }

    res.status(200).json({
      message: "Classe et relations mises à jour avec succès ✅",
      classe,
    });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// 🔴 Delete (avec suppression relationnelle)
module.exports.deleteClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // 🔹 Supprimer la référence dans les enseignants
    await User.updateMany(
      { _id: { $in: classe.enseignants } },
      { $pull: { classes: classe._id } }
    );

    // 🔹 Supprimer la référence dans les étudiants
    await User.updateMany(
      { _id: { $in: classe.etudiants } },
      { $unset: { classe: "" } }
    );

    // 🔹 Supprimer les cours liés à cette classe
    await Cours.deleteMany({ classe: classe._id });

    // 🔹 Supprimer la classe elle-même
    await Classe.findByIdAndDelete(id);

    res.status(200).json({ message: "Classe et ses relations supprimées avec succès 🗑️" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

// 🛑 Delete all classes (cascade)
module.exports.deleteAllClasses = async (req, res) => {
  try {
    const allClasses = await Classe.find();
    const classIds = allClasses.map((c) => c._id);

    // Supprimer relations dans Users et Cours
    await User.updateMany({}, { $pull: { classes: { $in: classIds } }, $unset: { classe: "" } });
    await Cours.deleteMany({ classe: { $in: classIds } });

    const result = await Classe.deleteMany({});
    res.status(200).json({
      message: `Toutes les classes et leurs relations ont été supprimées ✅`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
