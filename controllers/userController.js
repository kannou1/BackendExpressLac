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
const jwt = require("jsonwebtoken");
/* ===========================================================
  CREATE USERS
=========================================================== */

// Admin
module.exports.createAdmin = async (req, res) => {
  try {
    const userData = { ...req.body, role: "admin" };
    if (req.file) userData.image_User = req.file.filename;

    const newUser = new userModel(userData);
    await newUser.save();

    res.status(201).json({ message: "Admin créé avec succès ✅", newUser });
  } catch (error) {
    console.error("❌ Erreur createAdmin:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Enseignant
module.exports.createEnseignant = async (req, res) => {
  try {
    const userData = { ...req.body, role: "enseignant" };
    if (req.file) userData.image_User = req.file.filename;

    // Vérifie que les classes existent
    if (userData.classes && userData.classes.length > 0) {
      const classes = await classeModel.find({ _id: { $in: userData.classes } });
      if (classes.length !== userData.classes.length) {
        return res.status(404).json({ message: "Une ou plusieurs classes sont introuvables." });
      }
    }

    const newUser = new userModel(userData);
    await newUser.save();

    // Associer bidirectionnellement enseignant ↔ classes
    if (userData.classes && userData.classes.length > 0) {
      for (const classeId of userData.classes) {
        const classe = await classeModel.findById(classeId);
        if (!classe) continue;

        if (!classe.enseignants.includes(newUser._id)) {
          classe.enseignants.push(newUser._id);
          await classe.save();
        }

        if (!newUser.classes.includes(classe._id)) {
          newUser.classes.push(classe._id);
        }
      }
      await newUser.save();
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

// Étudiant
module.exports.createEtudiant = async (req, res) => {
  try {
    const userData = { ...req.body, role: "etudiant" };
    if (req.file) userData.image_User = req.file.filename;

    if (!userData.classe) {
      return res.status(400).json({ message: "La classe de l'étudiant est obligatoire." });
    }

    const classe = await classeModel.findById(userData.classe);
    if (!classe) return res.status(404).json({ message: "Classe introuvable." });

    const newUser = new userModel(userData);
    await newUser.save();

    // Associer bidirectionnellement
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

/* ===========================================================
  GET USERS
=========================================================== */

// Tous les utilisateurs
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");

    const cleanUsers = await Promise.all(
      users.map(async (u) => {
        const user = u.toObject();

        if (user.role === "etudiant") {
          return await userModel.findById(user._id)
            .select("-password")
            .populate({
              path: "classe",
              select: "nom annee specialisation anneeAcademique",
              populate: { path: "examens", select: "nom type date noteMax description" },
            })
            .populate("notes", "valeur examen")
            .populate("presences", "date statut cours")
            .populate("demandes", "type statut createdAt");
        }

        if (user.role === "enseignant") {
          return await userModel.findById(user._id)
            .select("-password")
            .populate("coursEnseignes", "nom code credits semestre")
            .populate({
              path: "classes",
              select: "nom annee specialisation anneeAcademique",
              populate: { path: "examens", select: "nom type date noteMax description" },
            })
            .populate("demandes", "type statut createdAt");
        }

        return user;
      })
    );

    res.status(200).json(cleanUsers);
  } catch (error) {
    console.error("❌ Erreur getAllUsers:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Admins
module.exports.getAdmins = async (_, res) => {
  try {
    const admins = await userModel.find({ role: "admin" }).select("prenom nom email role image_User createdAt");
    res.status(200).json(admins);
  } catch (error) {
    console.error("❌ Erreur getAdmins:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Enseignants
module.exports.getEnseignants = async (_, res) => {
  try {
    const enseignants = await userModel
      .find({ role: "enseignant" })
      .select("prenom nom email role specialite dateEmbauche NumTelEnseignant image_User")
      .populate("coursEnseignes", "nom code credits semestre")
      .populate({
        path: "classes",
        select: "nom annee specialisation anneeAcademique",
        populate: { path: "examens", select: "nom type date noteMax description" },
      })
      .populate("demandes", "type statut createdAt");

    res.status(200).json(enseignants);
  } catch (error) {
    console.error("❌ Erreur getEnseignants:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Étudiants
module.exports.getEtudiants = async (_, res) => {
  try {
    const etudiants = await userModel
      .find({ role: "etudiant" })
      .select("prenom nom email role image_User")
      .populate({
        path: "classe",
        select: "nom annee specialisation anneeAcademique",
        populate: { path: "examens", select: "nom type date noteMax description" },
      })
      .populate("notes", "valeur examen")
      .populate("presences", "date statut cours")
      .populate("demandes", "type statut createdAt");

    res.status(200).json(etudiants);
  } catch (error) {
    console.error("❌ Erreur getEtudiants:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// User par ID
module.exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    let query = userModel.findById(id).select("-password");

    if (user.role === "etudiant") {
      query = query.populate({
        path: "classe",
        select: "nom annee specialisation anneeAcademique",
        populate: { path: "examens", select: "nom type date noteMax description" },
      });
    } else if (user.role === "enseignant") {
      query = query.populate({
        path: "classes",
        select: "nom annee specialisation anneeAcademique",
        populate: { path: "examens", select: "nom type date noteMax description" },
      });
    }

    const populatedUser = await query.exec();
    res.status(200).json(populatedUser);
  } catch (error) {
    console.error("❌ Erreur getUserById:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  UPDATE & DELETE
=========================================================== */

// ------------------- UPDATE USER -------------------
module.exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (req.file) {
      if (user.image_User) await deleteImageFile(user.image_User);
      updateData.image_User = req.file.filename;
    }

  // Gestion classe (étudiant)
    if (user.role === "etudiant" && updateData.classe && updateData.classe !== user.classe?.toString()) {
      if (user.classe) await classeModel.updateOne({ _id: user.classe }, { $pull: { etudiants: id } });
      await classeModel.updateOne({ _id: updateData.classe }, { $addToSet: { etudiants: id } });
    }

  // Gestion classes (enseignant)
    if (user.role === "enseignant" && updateData.classes) {
      const oldClasses = user.classes.map((c) => c.toString());
      const newClasses = updateData.classes;
      await classeModel.updateMany({ _id: { $in: oldClasses } }, { $pull: { enseignants: id } });
      await classeModel.updateMany({ _id: { $in: newClasses } }, { $addToSet: { enseignants: id } });
    }

    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Utilisateur mis à jour ✅", updatedUser });
  } catch (error) {
    console.error("❌ Erreur updateUserById:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
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
    if (!isMatch) return res.status(400).json({ message: "Ancien mot de passe incorrect." });

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
      });
    }

    user.password = newPassword;
    await user.save();

  // Email notification
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

    res.status(200).json({ message: "Mot de passe mis à jour et email de confirmation envoyé ✅" });
  } catch (error) {
    console.error("❌ Erreur updatePassword:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- DELETE USER -------------------
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
      Demande.deleteMany({ etudiant: id }),
      Message.deleteMany({ $or: [{ expediteur: id }, { destinataire: id }] }),
      Notification.deleteMany({ utilisateur: id }),
      // StageRequest && StageRequest.deleteMany({ $or: [{ etudiant: id }, { validePar: id }] })
    ]);

    await userModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Utilisateur et données liées supprimés ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteUserById:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   HELPERS
=========================================================== */

const deleteImageFile = async (filename) => {
  if (!filename || ["default.png", "placeholder.jpg", "client.png"].includes(filename)) return;
  const filePath = path.join(__dirname, "..", "public", "images", filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("Erreur suppression fichier image:", err.message);
  }
};

// ------------------- DELETE ALL USERS -------------------
module.exports.deleteAllUsers = async (req, res) => {
  try {
    await userModel.deleteMany({});
    res.status(200).json({ message: "Tous les utilisateurs ont été supprimés ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllUsers:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
// ===========================================================
// AUTHENTIFICATION (LOGIN / LOGOUT / GET AUTH)
// ===========================================================

const maxAge = 1 * 60 * 60; // 1h en secondes

const createToken = (id) => {
  return jwt.sign({ id },  process.env.JWT_SECRET, { expiresIn: maxAge });
};

// ------------------- LOGIN -------------------
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email et mot de passe requis." });

    // Utilise la méthode statique définie dans le schéma
    const user = await userModel.login(email, password);

    

    const token = createToken(user._id);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Connexion réussie ✅",
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        image_User: user.image_User,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Erreur login:", error.message);
    res.status(401).json({ message: error.message });
  }
};

// ------------------- GET USER AUTH -------------------
module.exports.getUserAuth = async (req, res) => {
  try {
    // L’id doit venir du middleware JWT (ex: req.user.id)
    const id = req.user?._id || req.user?.id;

    if (!id) return res.status(401).json({ message: "Utilisateur non authentifié" });

    const user = await userModel
      .findById(id)
      .select("-password")
      .populate("classe", "nom annee specialisation anneeAcademique")
      .populate("classes", "nom annee specialisation anneeAcademique")
      .populate("coursEnseignes", "nom code credits semestre");

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Erreur getUserAuth:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ------------------- LOGOUT -------------------
module.exports.logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Déconnexion réussie ✅" });
  } catch (error) {
    console.error("❌ Erreur logout:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
