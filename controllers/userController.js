const userModel = require("../models/userSchema");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const classeModel = require("../models/classeSchema");
const nodemailer = require("nodemailer");
// Related models for cascade delete
const Cours = require("../models/coursSchema");
const Examen = require("../models/examenSchema");
const Note = require("../models/noteSchema");
const Presence = require("../models/presenceSchema");
const Demande = require("../models/demandeSchema");
const Message = require("../models/messageSchema");
const Notification = require("../models/notificationSchema");
const StageRequest = require("../models/stageRequestSchema");

// ------------------- CREATE USERS -------------------

// Créer un ADMIN
module.exports.createAdmin = async (req, res) => {
  try {
    const userData = { ...req.body, role: "admin" };
    if (req.file) userData.image_User = req.file.filename;

    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({  message: "Admin créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Créer un ENSEIGNANT
module.exports.createEnseignant = async (req, res) => {
  try {
    const userData = { ...req.body, role: "enseignant" };
    if (req.file) userData.image_User = req.file.filename;

    // 🔹 Vérifier les classes (si fournies)
    if (userData.classes && userData.classes.length > 0) {
      const classes = await classeModel.find({ _id: { $in: userData.classes } });
      if (classes.length !== userData.classes.length) {
        return res.status(404).json({ message: "Une ou plusieurs classes sont introuvables." });
      }
    }

    // 🔹 Créer l’enseignant
    const newUser = new userModel(userData);
    await newUser.save();

    // 🔹 Si des classes sont spécifiées, les lier des deux côtés
    if (userData.classes && userData.classes.length > 0) {
      for (const classeId of userData.classes) {
        const classe = await classeModel.findById(classeId);
        if (!classe) throw new Error(`Classe introuvable (${classeId})`);

        // ✅ Ajout enseignant -> classe
        if (!Array.isArray(classe.enseignants)) classe.enseignants = [];
        if (!classe.enseignants.includes(newUser._id)) {
          classe.enseignants.push(newUser._id);
          await classe.save();
        }

        // ✅ Ajout classe -> enseignant (sécurité côté user)
        if (!Array.isArray(newUser.classes)) newUser.classes = [];
        if (!newUser.classes.includes(classe._id)) {
          newUser.classes.push(classe._id);
        }
      }
      await newUser.save(); // enregistrer les relations côté enseignant
    }

    res.status(201).json({
      message: "Enseignant créé et associé à ses classes avec succès ✅",
      newUser,
    });
  } catch (error) {
    console.error("❌ Erreur createEnseignant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Créer un ÉTUDIANT
module.exports.createEtudiant = async (req, res) => {
  try {
    console.log("🟢 Requête reçue:", req.body);

    const userData = { ...req.body, role: "etudiant" };
    if (req.file) userData.image_User = req.file.filename;

    // 🔹 Classe obligatoire
    if (!userData.classe) {
      return res.status(400).json({ message: "La classe de l'étudiant est obligatoire." });
    }

    const classe = await classeModel.findById(userData.classe);
    if (!classe) {
      console.error("❌ Classe introuvable avec ID:", userData.classe);
      return res.status(404).json({ message: "Classe introuvable." });
    }

    // 🔹 Créer l’étudiant
    const newUser = new userModel(userData);
    await newUser.save();

    // 🔹 Ajouter bidirectionnellement
    if (!Array.isArray(classe.etudiants)) classe.etudiants = [];
    if (!classe.etudiants.includes(newUser._id)) {
      classe.etudiants.push(newUser._id);
      await classe.save();
    }

    if (!newUser.classe || newUser.classe.toString() !== classe._id.toString()) {
      newUser.classe = classe._id;
      await newUser.save();
    }

    res.status(201).json({
      message: "Étudiant créé et associé à sa classe avec succès ✅",
      newUser,
    });
  } catch (error) {
    console.error("❌ Erreur createEtudiant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- GET USERS -------------------
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");

    // 🔹 Nettoyer les données selon le rôle
    const cleanUsers = await Promise.all(
      users.map(async (u) => {
        const user = u.toObject();

        if (user.role === "etudiant") {
          const populated = await userModel.findById(user._id)
            .select("-password")
            .populate("classe", "nom annee specialisation anneeAcademique")
            .populate("notes", "valeur examen")
            .populate("presences", "date statut cours")
            .populate("demandes", "type statut dateCreation")
            .populate("stagesEffectues", "titre entreprise statut dateDebut dateFin")
            .populate("emplois", "jour heureDebut heureFin cours");

          return {
            _id: populated._id,
            prenom: populated.prenom,
            nom: populated.nom,
            email: populated.email,
            role: populated.role,
            image_User: populated.image_User,
            age: populated.age,
            classe: populated.classe,
            notes: populated.notes,
            presences: populated.presences,
            demandes: populated.demandes,
            stagesEffectues: populated.stagesEffectues,
            emplois: populated.emplois,
          };
        }

        if (user.role === "enseignant") {
          const populated = await userModel.findById(user._id)
            .select("-password")
            .populate("coursEnseignes", "nom code credits semestre")
            .populate({
              path: "coursEnseignes",
              populate: { path: "classe", select: "nom annee specialisation" }
            })
            .populate("demandes", "type statut dateCreation");

          return {
            _id: populated._id,
            prenom: populated.prenom,
            nom: populated.nom,
            email: populated.email,
            role: populated.role,
            image_User: populated.image_User,
            specialite: populated.specialite,
            dateEmbauche: populated.dateEmbauche,
            NumTelEnseignant: populated.NumTelEnseignant,
            coursEnseignes: populated.coursEnseignes,
            demandes: populated.demandes,
          };
        }

        // 🧱 Admin
        return {
          _id: user._id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          role: user.role,
          image_User: user.image_User,
        };
      })
    );

    res.status(200).json(cleanUsers);

  } catch (error) {
    console.error("Erreur getAllUsers:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


module.exports.getAdmins = async (req, res) => {
  try {
    const admins = await userModel
      .find({ role: "admin" })
      .select("prenom nom email role image_User createdAt");

    res.status(200).json(admins);
  } catch (error) {
    console.error("Erreur getAdmins:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


module.exports.getEnseignants = async (req, res) => {
  try {
    const enseignants = await userModel
      .find({ role: "enseignant" })
      .select("prenom nom email role specialite dateEmbauche NumTelEnseignant image_User")
      .populate("coursEnseignes", "nom code credits semestre")
      .populate({
        path: "coursEnseignes",
        populate: { path: "classe", select: "nom annee specialisation" }
      })
      .populate("classes", "nom annee specialisation anneeAcademique")

      .populate("demandes", "type statut dateCreation");

    res.status(200).json(enseignants);
  } catch (error) {
    console.error("Erreur getEnseignants:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


module.exports.getEtudiants = async (req, res) => {
  try {
    const etudiants = await userModel
      .find({ role: "etudiant" })
      .select("prenom nom email role age image_User")
      .populate("classe", "nom annee specialisation anneeAcademique ")
      .populate("notes", "valeur examen")
      .populate("presences", "date statut cours")
      .populate("demandes", "type statut dateCreation")
      .populate("stagesEffectues", "titre entreprise statut dateDebut dateFin")
      .populate("emplois", "jour heureDebut heureFin cours")


    res.status(200).json(etudiants);
  } catch (error) {
    console.error("Erreur getEtudiants:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Get user by ID (with relations)
module.exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Récupération de base
    const user = await userModel.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // 🌐 Requête avec population adaptée
    let query = userModel.findById(id).select("-password");

    // 🎓 Étudiant
    if (user.role.toLowerCase() === "etudiant") {
  query = query
    .populate("classe", "nom annee specialisation anneeAcademique ")
    .populate({
      path: "notes",
      populate: { path: "examen", select: "titre date cours" }
    })
    .populate("presences", "date statut cours")
    .populate("demandes", "type statut dateCreation")
    .populate("stagesEffectues", "titre entreprise statut dateDebut dateFin")
    .populate("emplois", "jour heureDebut heureFin cours");
}


    // 👨‍🏫 Enseignant
    else if (user.role === "enseignant") {
     query = query
    .populate("classes", "nom annee specialisation anneeAcademique") // ✅ Ajouté
    .populate("coursEnseignes", "nom code credits semestre")
    .populate({
      path: "coursEnseignes",
      populate: { path: "classe", select: "nom annee specialisation" }
    })
    .populate("demandes", "type statut dateCreation");
}

    // 🛠️ Admin
    else if (user.role === "admin") {
      query = query.populate("demandes", "type statut dateCreation");
    }

    const populatedUser = await query.exec();
    const cleanUser = populatedUser.toObject();

    // 🧹 Suppression des champs inutiles selon le rôle
    if (user.role === "enseignant") {
      delete cleanUser.notes;
      delete cleanUser.presences;
      delete cleanUser.stagesEffectues;
      delete cleanUser.stagesValidations;
      delete cleanUser.emplois;
      delete cleanUser.classe;
    }

    if (user.role === "etudiant") {
      delete cleanUser.coursEnseignes;
      delete cleanUser.stagesValidations;
    }

    if (user.role === "admin") {
      delete cleanUser.coursEnseignes;
      delete cleanUser.notes;
      delete cleanUser.presences;
      delete cleanUser.stagesEffectues;
      delete cleanUser.stagesValidations;
      delete cleanUser.emplois;
      delete cleanUser.classe;
    }

    // 🚫 Supprimer toujours les champs inutiles pour tous les rôles
    delete cleanUser.messages;
    delete cleanUser.notifications;
    delete cleanUser.resetPasswordToken;
    delete cleanUser.resetPasswordExpires;
    delete cleanUser.__v;

    // ✅ Réponse finale propre
    res.status(200).json(cleanUser);

  } catch (error) {
    console.error("Erreur getUserById:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur", error });
  }
};



// ------------------- UPDATE USER -------------------
module.exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Gérer les images
    if (req.file) {
      if (user.image_User) await deleteImageFile(user.image_User);
      updateData.image_User = req.file.filename;
    }

    // 🔁 Si changement de classe (étudiant)
    if (user.role === "etudiant" && updateData.classe && updateData.classe !== user.classe?.toString()) {
      if (user.classe) await classeModel.updateOne({ _id: user.classe }, { $pull: { etudiants: id } });
      await classeModel.updateOne({ _id: updateData.classe }, { $addToSet: { etudiants: id } });
    }

    // 🔁 Si changement de classes (enseignant)
    if (user.role === "enseignant" && updateData.classes) {
      const oldClasses = user.classes.map(c => c.toString());
      const newClasses = updateData.classes;

      await classeModel.updateMany({ _id: { $in: oldClasses } }, { $pull: { enseignants: id } });
      await classeModel.updateMany({ _id: { $in: newClasses } }, { $addToSet: { enseignants: id } });
    }

    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Utilisateur mis à jour ✅", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
// ------------------- UPDATE PASSWORD -------------------
module.exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Ancien mot de passe incorrect." });

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
      });
    }

    user.password = newPassword;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🔐 Votre mot de passe a été changé",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; border-radius:10px; background-color:#f9f9f9;">
          <h2 style="color:#4F46E5;">EduNex</h2>
          <p>Bonjour <strong>${user.prenom}</strong>,</p>
          <p>Votre mot de passe a été mis à jour avec succès ✅</p>
          <p>Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement l'administrateur.</p>
          <p style="font-size:12px; color:#888;">© 2025 EduNex. Tous droits réservés.</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "Mot de passe mis à jour et email de confirmation envoyé !",
    });
  } catch (error) {
    console.error("Erreur updatePassword:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du mot de passe.",
      error: error.message,
    });
  }
};

// ------------------- DELETE USER (Cascade Delete) -------------------
module.exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (user.image_User) await deleteImageFile(user.image_User);

    if (user.role === "etudiant" && user.classe) {
      await classeModel.updateOne({ _id: user.classe }, { $pull: { etudiants: id } });
    }

    if (user.role === "enseignant" && user.classes.length > 0) {
      await classeModel.updateMany({ _id: { $in: user.classes } }, { $pull: { enseignants: id } });
    }

    await Promise.all([
      Cours.deleteMany({ enseignant: id }),
      Examen.deleteMany({ enseignant: id }),
      Note.deleteMany({ etudiant: id }),
      Presence.deleteMany({ etudiant: id }),
      Demande.deleteMany({ utilisateur: id }),
      Message.deleteMany({ $or: [{ expediteur: id }, { destinataire: id }] }),
      Notification.deleteMany({ utilisateur: id }),
      StageRequest.deleteMany({ $or: [{ etudiant: id }, { validePar: id }] })
    ]);

    await userModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Utilisateur et données liées supprimés ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

/* ===========================================================
   HELPERS
=========================================================== */

const deleteImageFile = async (filename) => {
  if (!filename || ["default.png", "placeholder.jpg"].includes(filename)) return;
  const filePath = path.join(__dirname, "..", "public", "images", filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("Erreur suppression fichier image:", err);
  }
};
//delete all users with all their related data
module.exports.deleteAllUsers = async (req, res) => {
  try {
    await userModel.deleteMany({});
    res.status(200).json({ message: "Tous les utilisateurs ont été supprimés ✅" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
}; 