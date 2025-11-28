const Emploi = require("../models/emploiDuTempsSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🟢 CREATE EMPLOI
=========================================================== */
module.exports.createEmploi = async (req, res) => {
  try {
    let { jourSemaine, heureDebut, heureFin, salle, typeCours, classe: classeId, cours } = req.body;

    if (!cours) return res.status(400).json({ message: "Cours manquant." });
    if (!Array.isArray(cours)) cours = [cours];

    if (!jourSemaine || !heureDebut || !heureFin || !salle || !typeCours || !classeId) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas remplis." });
    }

    // Verify classe exists
    const classe = await Classe.findById(classeId).populate("etudiants", "_id prenom nom");
    if (!classe) return res.status(404).json({ message: "Classe introuvable." });

    // Verify all courses exist
    const validCours = await Cours.find({ _id: { $in: cours } });
    if (validCours.length !== cours.length) return res.status(404).json({ message: "Certains cours sont introuvables." });

    // === CHECK FOR TIME CONFLICTS ===
    const existingEmplois = await Emploi.find({ classe: classeId, jourSemaine });
    const conflict = existingEmplois.some(e => {
      return (
        (heureDebut >= e.heureDebut && heureDebut < e.heureFin) ||
        (heureFin > e.heureDebut && heureFin <= e.heureFin) ||
        (heureDebut <= e.heureDebut && heureFin >= e.heureFin)
      );
    });

    if (conflict) {
      return res.status(400).json({ message: "Conflit : un autre cours est déjà prévu à cette période pour cette classe." });
    }

    // Create emploi du temps
    const newEmploi = new Emploi({
      jourSemaine,
      heureDebut,
      heureFin,
      salle,
      typeCours,
      classe: classeId,
      cours,
    });
    await newEmploi.save();

    // Update classe and courses
    await Classe.findByIdAndUpdate(classeId, { $addToSet: { emplois: newEmploi._id } });
    await Promise.all(cours.map(id => Cours.findByIdAndUpdate(id, { $addToSet: { emplois: newEmploi._id } })));

    // Send notifications
    await sendEmploiNotification(req, classe, `📅 Nouvel emploi du temps ajouté pour la classe "${classe.nom}" le ${jourSemaine} de ${heureDebut} à ${heureFin} en salle ${salle}.`);

    res.status(201).json({ message: "Emploi du temps créé avec succès ✅", emploi: newEmploi });

  } catch (error) {
    console.error("❌ Erreur createEmploi:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


/* ===========================================================
   ✏️ UPDATE EMPLOI
=========================================================== */
module.exports.updateEmploi = async (req, res) => {
  try {
    const updatedEmploi = await Emploi.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEmploi) return res.status(404).json({ message: "Emploi introuvable." });

    const classe = await Classe.findById(updatedEmploi.classe).populate("etudiants", "_id prenom nom");

    await sendEmploiNotification(req, classe, `✏️ L’emploi du temps du ${updatedEmploi.jourSemaine} a été modifié.`);

    res.status(200).json({ message: "Emploi mis à jour ✅", emploi: updatedEmploi });
  } catch (error) {
    console.error("❌ Erreur updateEmploi:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE EMPLOI
=========================================================== */
module.exports.deleteEmploi = async (req, res) => {
  try {
    const deletedEmploi = await Emploi.findByIdAndDelete(req.params.id);
    if (!deletedEmploi) return res.status(404).json({ message: "Emploi introuvable." });

    await Classe.updateMany({}, { $pull: { emplois: deletedEmploi._id } });
    await Cours.updateMany({}, { $pull: { emplois: deletedEmploi._id } });

    const classe = await Classe.findById(deletedEmploi.classe).populate("etudiants", "_id prenom nom");
    await sendEmploiNotification(req, classe, `🚫 L’emploi du temps du ${deletedEmploi.jourSemaine} a été annulé.`);

    res.status(200).json({ message: "Emploi supprimé avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteEmploi:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL EMPLOIS
=========================================================== */
module.exports.getAllEmplois = async (req, res) => {
  try {
    let emplois;
    if (req.user.role === "etudiant") {
      const user = await User.findById(req.user.id).populate("classe");
      if (!user?.classe) return res.status(404).json({ message: "Classe introuvable." });
      emplois = await Emploi.find({ classe: user.classe._id })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation");
    } else if (req.user.role === "enseignant") {
      emplois = await Emploi.find({ "cours.enseignantId": req.user.id })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation");
    } else {
      emplois = await Emploi.find()
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation");
    }
    res.status(200).json(emplois);
  } catch (error) {
    console.error("❌ Erreur getAllEmplois:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET EMPLOI BY ID
=========================================================== */
module.exports.getEmploiById = async (req, res) => {
  try {
    const emploi = await Emploi.findById(req.params.id)
      .populate("cours", "nom code")
      .populate("classe", "nom annee specialisation");
    if (!emploi) return res.status(404).json({ message: "Emploi introuvable." });
    res.status(200).json(emploi);
  } catch (error) {
    console.error("❌ Erreur getEmploiById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE ALL EMPLOIS
=========================================================== */
module.exports.deleteAllEmplois = async (req, res) => {
  try {
    await Emploi.deleteMany({});
    await Classe.updateMany({}, { $set: { emplois: [] } });
    await Cours.updateMany({}, { $set: { emplois: [] } });
    res.status(200).json({ message: "Tous les emplois du temps ont été supprimés ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllEmplois:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ⚙️ UTIL: SEND NOTIFICATIONS
=========================================================== */
async function sendEmploiNotification(req, classe, message) {
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
