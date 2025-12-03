const Examen = require("../models/examenSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🟢 CREATE EXAM
=========================================================== */
module.exports.createExamen = async (req, res) => {
  try {
    const { nom, type, date, noteMax, description, coursId, enseignantId, classeId } = req.body;

    if (!nom || !type || !date || !noteMax || !coursId) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas remplis." });
    }

    const cours = await Cours.findById(coursId);
    if (!cours) return res.status(404).json({ message: "Cours introuvable." });

    let enseignant = enseignantId ? await User.findById(enseignantId) : null;
    if (enseignant && enseignant.role !== "enseignant") {
      return res.status(400).json({ message: "Rôle enseignant invalide." });
    }

    let classe = classeId
      ? await Classe.findById(classeId).populate("etudiants", "_id prenom nom")
      : null;

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

    await Promise.all([
      Cours.findByIdAndUpdate(coursId, { $addToSet: { examens: newExam._id } }),
      classe ? Classe.findByIdAndUpdate(classeId, { $addToSet: { examens: newExam._id } }) : null,
      enseignant ? User.findByIdAndUpdate(enseignantId, { $addToSet: { examens: newExam._id } }) : null,
    ]);

    // === NOTIFICATION CREATION ===
    await sendExamNotification(req, classe, `📘 Nouvel examen ajouté : "${nom}" (${type}) prévu le ${new Date(date).toLocaleDateString()}`);

    res.status(201).json({ message: "Examen créé avec succès ✅", examen: newExam });
  } catch (error) {
    console.error("❌ Erreur createExamen:", error);
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

    const classe = await Classe.findById(updatedExam.classeId).populate("etudiants", "_id prenom nom");

    await sendExamNotification(req, classe, `✏️ L'examen "${updatedExam.nom}" a été modifié. Consultez les détails.`);

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

    await Promise.all([
      Cours.updateMany({}, { $pull: { examens: deletedExam._id } }),
      Classe.updateMany({}, { $pull: { examens: deletedExam._id } }),
      User.updateMany({}, { $pull: { examens: deletedExam._id } }),
    ]);

    const classe = await Classe.findById(deletedExam.classeId).populate("etudiants", "_id prenom nom");

    await sendExamNotification(req, classe, `🚫 L'examen "${deletedExam.nom}" a été annulé.`);

    res.status(200).json({ message: "Examen supprimé avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL EXAMS
=========================================================== */
module.exports.getAllExamens = async (req, res) => {
  try {
    let examens;

    if (req.user.role === "etudiant") {
      const user = await User.findById(req.user.id).populate("classe");
      if (!user || !user.classe) {
        return res.status(404).json({ message: "Classe de l'étudiant introuvable." });
      }

      examens = await Examen.find({ classeId: user.classe._id })
        .populate("coursId", "nom code")
        .populate("enseignantId", "nom prenom email")
        .populate("classeId", "nom annee specialisation");
    } else if (req.user.role === "enseignant") {
      examens = await Examen.find({ enseignantId: req.user.id })
        .populate("coursId", "nom code")
        .populate("classeId", "nom annee specialisation");
    } else {
      examens = await Examen.find()
        .populate("coursId", "nom code")
        .populate("enseignantId", "nom prenom email")
        .populate("classeId", "nom annee specialisation");
    }

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
      .populate("classeId", "nom annee specialisation")
      .populate("submissions.studentId", "nom prenom email"); // ✅ Populate student info
    
    if (!examen) return res.status(404).json({ message: "Examen introuvable." });
    
    res.status(200).json(examen);
  } catch (error) {
    console.error("❌ Erreur getExamenById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📤 SUBMIT ASSIGNMENT - CORRECTED
=========================================================== */
module.exports.submitAssignment = async (req, res) => {
  try {
    const { examenId } = req.params;
    const studentId = req.user.id; // ✅ From auth middleware
    
    console.log("📝 Submit Assignment:");
    console.log("Examen ID:", examenId);
    console.log("Student ID:", studentId);
    console.log("File:", req.file);

    // ✅ Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Fichier requis" });
    }

    // ✅ Find the exam
    const examen = await Examen.findById(examenId).populate("enseignantId");
    if (!examen) {
      return res.status(404).json({ message: "Examen introuvable" });
    }

    // ✅ Check if it's an assignment type (case-insensitive)
    if (examen.type.toLowerCase() !== "assignment") {
      return res.status(400).json({ 
        message: "Impossible de soumettre un fichier pour cet examen." 
      });
    }

    // ✅ Check if past due date
    if (examen.date && new Date(examen.date) < new Date()) {
      return res.status(400).json({ 
        message: "La date limite de soumission est dépassée" 
      });
    }

    // ✅ Initialize submissions array if not exists
    if (!examen.submissions) {
      examen.submissions = [];
    }

    // ✅ Check if student already submitted
    const existingSubmissionIndex = examen.submissions.findIndex(
      sub => sub.studentId.toString() === studentId.toString()
    );

    if (existingSubmissionIndex !== -1) {
      return res.status(400).json({ 
        message: "Vous avez déjà soumis ce devoir" 
      });
    }

    // ✅ Create submission object
    const newSubmission = {
      studentId: studentId,
      file: req.file.filename, // ✅ Use filename from multer
      dateSubmission: new Date(),
      note: null,
      commentaire: null
    };

    // ✅ Add submission
    examen.submissions.push(newSubmission);
    await examen.save();

    console.log("✅ Assignment submitted successfully");

    // ✅ Send notification to teacher
    if (examen.enseignantId) {
      try {
        const student = await User.findById(studentId);
        const studentName = student ? `${student.prenom} ${student.nom}` : "Un étudiant";
        
        const notif = await Notification.create({
          message: `📩 ${studentName} a soumis l'assignment "${examen.nom}"`,
          type: "submission",
          utilisateur: examen.enseignantId._id,
        });

        await User.findByIdAndUpdate(examen.enseignantId._id, { 
          $push: { notifications: notif._id } 
        });

        if (req.app.io) {
          req.app.io.to(examen.enseignantId._id.toString()).emit("receiveNotification", {
            message: notif.message,
            type: notif.type,
            date: new Date(),
          });
        }
      } catch (notifError) {
        console.error("⚠️ Erreur notification:", notifError);
        // Don't fail the submission if notification fails
      }
    }

    res.status(200).json({ 
      message: "Fichier soumis avec succès ✅", 
      submission: newSubmission 
    });

  } catch (err) {
    console.error("❌ submitAssignment error:", err);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: err.message 
    });
  }
};

/* ===========================================================
   ⚙️ FONCTION UTILITAIRE : envoi notification + socket
=========================================================== */
async function sendExamNotification(req, classe, message) {
  try {
    if (!classe || !classe.etudiants?.length) return;

    const io = req.app.io; // ✅ Changed from req.io to req.app.io
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
    console.error("⚠️ Erreur lors de l'envoi des notifications :", err);
  }
}
