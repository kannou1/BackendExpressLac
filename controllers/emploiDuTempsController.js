const EmploiDuTemps = require("../models/emploiDuTempsSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");

/* ===========================================================
   🟢 CREATE
=========================================================== */
module.exports.createEmploiDuTemps = async (req, res) => {
  try {
    const newEDT = await EmploiDuTemps.create(req.body);

    // 🔍 Récupérer la classe liée
    const classe = await Classe.findById(newEDT.classe).populate("etudiants enseignants");

    if (classe) {
      const message = `🗓️ Un nouvel emploi du temps a été ajouté pour la classe ${classe.nom}`;
      const type = "emploiDuTemps";

      // 🔔 Envoyer à tous les étudiants et enseignants
      [...classe.etudiants, ...classe.enseignants].forEach(user => {
        req.io.to(user._id.toString()).emit("receiveNotification", {
          message,
          type,
          date: new Date(),
        });
      });
    }

    res.status(201).json(newEDT);
  } catch (error) {
    console.error("❌ Erreur createEmploiDuTemps:", error);
    res.status(400).json({ message: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL
=========================================================== */
module.exports.getAllEmploiDuTemps = async (req, res) => {
  try {
    const edt = await EmploiDuTemps.find().populate("cours classe");
    res.status(200).json(edt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================================================
   🔍 GET BY ID
=========================================================== */
module.exports.getEmploiDuTempsById = async (req, res) => {
  try {
    const edt = await EmploiDuTemps.findById(req.params.id).populate("cours classe");
    if (!edt) return res.status(404).json({ message: "Emploi du temps introuvable" });
    res.status(200).json(edt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE
=========================================================== */
module.exports.updateEmploiDuTemps = async (req, res) => {
  try {
    const updatedEDT = await EmploiDuTemps.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("classe");
    if (!updatedEDT) return res.status(404).json({ message: "Emploi du temps introuvable" });

    // 🔔 Notifier la classe concernée
    const classe = await Classe.findById(updatedEDT.classe).populate("etudiants enseignants");
    if (classe) {
      const message = `🕐 L’emploi du temps de la classe ${classe.nom} a été mis à jour.`;
      const type = "emploiDuTemps";

      [...classe.etudiants, ...classe.enseignants].forEach(user => {
        req.io.to(user._id.toString()).emit("receiveNotification", {
          message,
          type,
          date: new Date(),
        });
      });
    }

    res.status(200).json(updatedEDT);
  } catch (error) {
    console.error("❌ Erreur updateEmploiDuTemps:", error);
    res.status(400).json({ message: error.message });
  }
};

/* ===========================================================
   ❌ DELETE
=========================================================== */
module.exports.deleteEmploiDuTemps = async (req, res) => {
  try {
    const deletedEDT = await EmploiDuTemps.findByIdAndDelete(req.params.id).populate("classe");
    if (!deletedEDT) return res.status(404).json({ message: "Emploi du temps introuvable" });

    // 🔔 Notifier la classe
    const classe = await Classe.findById(deletedEDT.classe).populate("etudiants enseignants");
    if (classe) {
      const message = `⚠️ L’emploi du temps de la classe ${classe.nom} a été supprimé.`;
      const type = "emploiDuTemps";

      [...classe.etudiants, ...classe.enseignants].forEach(user => {
        req.io.to(user._id.toString()).emit("receiveNotification", {
          message,
          type,
          date: new Date(),
        });
      });
    }

    res.status(200).json({ message: "Emploi du temps supprimé ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================================================
   ⚠️ DELETE ALL
=========================================================== */
module.exports.deleteAllEmploiDuTemps = async (req, res) => {
  try {
    const result = await EmploiDuTemps.deleteMany({});

    // 🔔 Notifier tout le monde (si besoin)
    const allUsers = await User.find({});
    allUsers.forEach(user => {
      req.io.to(user._id.toString()).emit("receiveNotification", {
        message: "⚠️ Tous les emplois du temps ont été supprimés du système.",
        type: "emploiDuTemps",
        date: new Date(),
      });
    });

    res.status(200).json({
      message: "Tous les emplois du temps supprimés ✅",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
