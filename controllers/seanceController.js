const Seance = require("../models/seanceSchema");
const EmploiDuTemps = require("../models/emploiDuTempsSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🟢 CREATE SEANCE
=========================================================== */
module.exports.createSeance = async (req, res) => {
  try {
    const { dateDebut, dateFin, jourSemaine, heureDebut, heureFin, salle, typeCours, cours, classe, emploiDuTemps, notes } = req.body;

    if (!dateDebut || !dateFin || !jourSemaine || !heureDebut || !heureFin || !salle || !typeCours || !cours || !classe || !emploiDuTemps) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas remplis." });
    }

    // Verify relations exist
    const emploi = await EmploiDuTemps.findById(emploiDuTemps);
    if (!emploi) return res.status(404).json({ message: "Emploi du temps introuvable." });

    const coursDoc = await Cours.findById(cours);
    if (!coursDoc) return res.status(404).json({ message: "Cours introuvable." });

    const classeDoc = await Classe.findById(classe);
    if (!classeDoc) return res.status(404).json({ message: "Classe introuvable." });

    // Check for time conflicts in the same emploi du temps
    const existingSeances = await Seance.find({ emploiDuTemps, jourSemaine });
    const conflict = existingSeances.some(s => {
      return (
        (heureDebut >= s.heureDebut && heureDebut < s.heureFin) ||
        (heureFin > s.heureDebut && heureFin <= s.heureFin) ||
        (heureDebut <= s.heureDebut && heureFin >= s.heureFin)
      );
    });

    if (conflict) {
      return res.status(400).json({ message: "Conflit : une autre séance est déjà prévue à cette période pour ce jour." });
    }

    // Create seance
    const newSeance = new Seance({
      dateDebut,
      dateFin,
      jourSemaine,
      heureDebut,
      heureFin,
      salle,
      typeCours,
      cours,
      classe,
      emploiDuTemps,
      notes,
    });
    await newSeance.save();

    // Update emploi du temps
    await EmploiDuTemps.findByIdAndUpdate(emploiDuTemps, { $addToSet: { seances: newSeance._id } });

    // Update cours and classe
    await Cours.findByIdAndUpdate(cours, { $addToSet: { seances: newSeance._id } });
    await Classe.findByIdAndUpdate(classe, { $addToSet: { seances: newSeance._id } });

    // Send notifications
    await sendSeanceNotification(req, classeDoc, `📅 Nouvelle séance ajoutée pour "${coursDoc.nom}" le ${jourSemaine} de ${heureDebut} à ${heureFin} en salle ${salle}.`);

    res.status(201).json({ message: "Séance créée avec succès ✅", seance: newSeance });

  } catch (error) {
    console.error("❌ Erreur createSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL SEANCES
=========================================================== */
module.exports.getAllSeances = async (req, res) => {
  try {
    let seances;
    if (req.user.role === "etudiant") {
      const user = await User.findById(req.user.id).populate("classe");
      if (!user?.classe) return res.status(404).json({ message: "Classe introuvable." });
      seances = await Seance.find({ classe: user.classe._id })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("emploiDuTemps", "titre");
    } else if (req.user.role === "enseignant") {
      seances = await Seance.find({ "cours.enseignantId": req.user.id })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("emploiDuTemps", "titre");
    } else {
      seances = await Seance.find()
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("emploiDuTemps", "titre");
    }
    res.status(200).json(seances);
  } catch (error) {
    console.error("❌ Erreur getAllSeances:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET SEANCE BY ID
=========================================================== */
module.exports.getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id)
      .populate("cours", "nom code")
      .populate("classe", "nom annee specialisation")
      .populate("emploiDuTemps", "titre");
    if (!seance) return res.status(404).json({ message: "Séance introuvable." });
    res.status(200).json(seance);
  } catch (error) {
    console.error("❌ Erreur getSeanceById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE SEANCE
=========================================================== */
module.exports.updateSeance = async (req, res) => {
  try {
    const updatedSeance = await Seance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSeance) return res.status(404).json({ message: "Séance introuvable." });

    const classe = await Classe.findById(updatedSeance.classe).populate("etudiants", "_id prenom nom");
    const cours = await Cours.findById(updatedSeance.cours);

    await sendSeanceNotification(req, classe, `✏️ La séance de "${cours.nom}" du ${updatedSeance.jourSemaine} a été modifiée.`);

    res.status(200).json({ message: "Séance mise à jour ✅", seance: updatedSeance });
  } catch (error) {
    console.error("❌ Erreur updateSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE SEANCE
=========================================================== */
module.exports.deleteSeance = async (req, res) => {
  try {
    const deletedSeance = await Seance.findByIdAndDelete(req.params.id);
    if (!deletedSeance) return res.status(404).json({ message: "Séance introuvable." });

    // Remove from emploi du temps
    await EmploiDuTemps.findByIdAndUpdate(deletedSeance.emploiDuTemps, { $pull: { seances: deletedSeance._id } });

    // Remove from cours and classe
    await Cours.findByIdAndUpdate(deletedSeance.cours, { $pull: { seances: deletedSeance._id } });
    await Classe.findByIdAndUpdate(deletedSeance.classe, { $pull: { seances: deletedSeance._id } });

    const classe = await Classe.findById(deletedSeance.classe).populate("etudiants", "_id prenom nom");
    const cours = await Cours.findById(deletedSeance.cours);

    await sendSeanceNotification(req, classe, `🚫 La séance de "${cours.nom}" du ${deletedSeance.jourSemaine} a été annulée.`);

    res.status(200).json({ message: "Séance supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE ALL SEANCES
=========================================================== */
module.exports.deleteAllSeances = async (req, res) => {
  try {
    await Seance.deleteMany({});
    await EmploiDuTemps.updateMany({}, { $set: { seances: [] } });
    await Cours.updateMany({}, { $set: { seances: [] } });
    await Classe.updateMany({}, { $set: { seances: [] } });
    res.status(200).json({ message: "Toutes les séances ont été supprimées ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllSeances:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ⚙️ UTIL: SEND NOTIFICATIONS
=========================================================== */
async function sendSeanceNotification(req, classe, message) {
  try {
    if (!classe?.etudiants?.length) return;

    const io = req.io;
    if (!io) {
      console.warn("⚠️ io non trouvé dans req.app (socket non initialisé)");
      return;
    }

    for (const etu of classe.etudiants) {
      const notif = await Notification.create({
        message,
        type: "rappel",
        utilisateur: etu._id,
      });

      await User.findByIdAndUpdate(etu._id, { $push: { notifications: notif._id } });

      io.to(etu._id.toString()).emit("receiveNotification", {
        message,
        type: "rappel",
        date: new Date(),
      });
    }
  } catch (err) {
    console.error("⚠️ Erreur lors de l’envoi des notifications :", err);
  }
}
