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
    const {
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
    } = req.body;

    if (
      !dateDebut ||
      !dateFin ||
      !jourSemaine ||
      !heureDebut ||
      !heureFin ||
      !salle ||
      !typeCours ||
      !cours ||
      !classe ||
      !emploiDuTemps
    ) {
      return res.status(400).json({
        message: "Tous les champs obligatoires ne sont pas remplis.",
      });
    }

    const emploi = await EmploiDuTemps.findById(emploiDuTemps);
    if (!emploi)
      return res.status(404).json({ message: "Emploi du temps introuvable." });

    const coursDoc = await Cours.findById(cours);
    if (!coursDoc)
      return res.status(404).json({ message: "Cours introuvable." });

    const classeDoc = await Classe.findById(classe).populate(
      "etudiants",
      "_id prenom nom email"
    );
    if (!classeDoc)
      return res.status(404).json({ message: "Classe introuvable." });

    // Check conflicts
    const existingSeances = await Seance.find({
      emploiDuTemps,
      jourSemaine,
    });

    const conflict = existingSeances.some((s) => {
      return (
        (heureDebut >= s.heureDebut && heureDebut < s.heureFin) ||
        (heureFin > s.heureDebut && heureFin <= s.heureFin) ||
        (heureDebut <= s.heureDebut && heureFin >= s.heureFin)
      );
    });

    if (conflict)
      return res.status(400).json({
        message:
          "Conflit : une autre séance est déjà prévue à cette période.",
      });

    const newSeance = await Seance.create({
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

    // update references
    await Promise.all([
      EmploiDuTemps.findByIdAndUpdate(emploiDuTemps, {
        $addToSet: { seances: newSeance._id },
      }),
      Cours.findByIdAndUpdate(cours, {
        $addToSet: { seances: newSeance._id },
      }),
      Classe.findByIdAndUpdate(classe, {
        $addToSet: { seances: newSeance._id },
      }),
    ]);

    // Send notification BEFORE sending response
    await sendSeanceNotification(
      req,
      classeDoc,
      coursDoc,
      `📅 Nouvelle séance ajoutée pour "${coursDoc.nom}" le ${jourSemaine} de ${heureDebut} à ${heureFin} en salle ${salle}.`,
      "creation"
    );

    res
      .status(201)
      .json({ message: "Séance créée avec succès", seance: newSeance });
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

      if (!user?.classe)
        return res.status(404).json({ message: "Classe introuvable." });

      seances = await Seance.find({ classe: user.classe._id })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("emploiDuTemps", "titre");
    } else if (req.user.role === "enseignant") {
      const all = await Seance.find()
        .populate("cours", "nom code enseignantId")
        .populate("classe", "nom annee specialisation")
        .populate("emploiDuTemps", "titre");

      seances = all.filter(
        (s) => s.cours?.enseignantId == req.user.id
      );
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

    if (!seance)
      return res.status(404).json({ message: "Séance introuvable." });

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
    const {
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
    } = req.body;

    const seance = await Seance.findById(req.params.id);
    if (!seance)
      return res.status(404).json({ message: "Séance introuvable." });

    const coursDoc = await Cours.findById(cours);
    const classeDoc = await Classe.findById(classe).populate(
      "etudiants",
      "_id prenom nom email"
    );

    if (!coursDoc || !classeDoc)
      return res.status(404).json({ message: "Cours/Classe introuvable." });

    // Check conflicts
    const otherSeances = await Seance.find({
      emploiDuTemps,
      jourSemaine,
      _id: { $ne: seance._id },
    });

    const conflict = otherSeances.some((s) => {
      return (
        (heureDebut >= s.heureDebut && heureDebut < s.heureFin) ||
        (heureFin > s.heureDebut && heureFin <= s.heureFin) ||
        (heureDebut <= s.heureDebut && heureFin >= s.heureFin)
      );
    });

    if (conflict)
      return res.status(400).json({
        message:
          "Conflit : une autre séance existe déjà dans cette période.",
      });

    // Relations updates
    const updates = [];

    if (seance.cours.toString() !== cours) {
      updates.push(
        Cours.findByIdAndUpdate(seance.cours, {
          $pull: { seances: seance._id },
        })
      );
      updates.push(
        Cours.findByIdAndUpdate(cours, {
          $addToSet: { seances: seance._id },
        })
      );
    }

    if (seance.classe.toString() !== classe) {
      updates.push(
        Classe.findByIdAndUpdate(seance.classe, {
          $pull: { seances: seance._id },
        })
      );
      updates.push(
        Classe.findByIdAndUpdate(classe, {
          $addToSet: { seances: seance._id },
        })
      );
    }

    if (seance.emploiDuTemps.toString() !== emploiDuTemps) {
      updates.push(
        EmploiDuTemps.findByIdAndUpdate(seance.emploiDuTemps, {
          $pull: { seances: seance._id },
        })
      );
      updates.push(
        EmploiDuTemps.findByIdAndUpdate(emploiDuTemps, {
          $addToSet: { seances: seance._id },
        })
      );
    }

    await Promise.all(updates);

    // Update fields
    Object.assign(seance, {
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

    const updated = await seance.save();

    // Send notification BEFORE sending response
    await sendSeanceNotification(
      req,
      classeDoc,
      coursDoc,
      `✏️ La séance de "${coursDoc.nom}" le ${jourSemaine} de ${heureDebut} à ${heureFin} a été modifiée.`,
      "modification"
    );

    res.status(200).json({
      message: "Séance mise à jour avec succès",
      seance: updated,
    });
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
    const seance = await Seance.findById(req.params.id);

    if (!seance)
      return res.status(404).json({ message: "Séance introuvable." });

    // Get class and course info BEFORE deletion
    const classeDoc = await Classe.findById(seance.classe).populate(
      "etudiants",
      "_id prenom nom email"
    );
    const coursDoc = await Cours.findById(seance.cours);

    // Now delete the seance
    await Seance.findByIdAndDelete(req.params.id);

    await Promise.all([
      EmploiDuTemps.findByIdAndUpdate(seance.emploiDuTemps, {
        $pull: { seances: seance._id },
      }),
      Cours.findByIdAndUpdate(seance.cours, {
        $pull: { seances: seance._id },
      }),
      Classe.findByIdAndUpdate(seance.classe, {
        $pull: { seances: seance._id },
      }),
    ]);

    // Send notification BEFORE sending response
    await sendSeanceNotification(
      req,
      classeDoc,
      coursDoc,
      `🚫 La séance de "${coursDoc?.nom}" du ${seance.jourSemaine} de ${seance.heureDebut} à ${seance.heureFin} a été annulée.`,
      "suppression"
    );

    res
      .status(200)
      .json({ message: "Séance supprimée avec succès" });
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
    await Promise.all([
      EmploiDuTemps.updateMany({}, { $set: { seances: [] } }),
      Cours.updateMany({}, { $set: { seances: [] } }),
      Classe.updateMany({}, { $set: { seances: [] } }),
    ]);

    res.status(200).json({
      message: "Toutes les séances ont été supprimées.",
    });
  } catch (error) {
    console.error("❌ Erreur deleteAllSeances:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📢 SEND NOTIFICATION (Centralized & Corrected)
=========================================================== */
async function sendSeanceNotification(req, classeDoc, coursDoc, message, actionType) {
  try {
    // Validate inputs
    if (!classeDoc || !classeDoc.etudiants || classeDoc.etudiants.length === 0) {
      console.warn("⚠️ Aucun étudiant trouvé dans la classe pour la notification");
      return;
    }

    if (!coursDoc) {
      console.warn("⚠️ Cours introuvable pour la notification");
      return;
    }

    // Get socket.io instance - Try multiple ways
    const io = req.io || req.app?.get("io") || global.io;
    
    if (!io) {
      console.error("❌ Socket.io instance non disponible - notifications en temps réel désactivées");
      // Continue to save in DB even if socket is not available
    }

    console.log(`📢 Envoi de notifications à ${classeDoc.etudiants.length} étudiants pour action: ${actionType}`);

    // Create notifications for all students
    const notificationPromises = classeDoc.etudiants.map(async (etu) => {
      try {
        // Save notification in DB
        const notif = await Notification.create({
          message: message,
          type: "seance",
          utilisateur: etu._id,
          lu: false,
          dateCreation: new Date(),
        });

        // Attach notification to user
        await User.findByIdAndUpdate(etu._id, {
          $push: { notifications: notif._id },
        });

        // Real-time push via Socket.io
        if (io) {
          const studentRoom = etu._id.toString();
          
          // Emit to specific student room
          io.to(studentRoom).emit("receiveNotification", {
            _id: notif._id,
            message: message,
            type: "seance",
            lu: false,
            dateCreation: notif.dateCreation,
            utilisateur: etu._id,
          });

          console.log(`✅ Notification envoyée à l'étudiant ${etu.prenom} ${etu.nom} (${studentRoom})`);
        }

        return notif;
      } catch (err) {
        console.error(`❌ Erreur pour l'étudiant ${etu._id}:`, err);
        return null;
      }
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    console.log(`✅ ${classeDoc.etudiants.length} notifications créées et envoyées`);

  } catch (err) {
    console.error("⚠️ Erreur lors de l'envoi des notifications séance:", err);
  }
}