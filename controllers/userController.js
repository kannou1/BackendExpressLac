const userModel = require("../models/userSchema");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// ------------------- CREATE USERS -------------------

// Créer un ADMIN
module.exports.createAdmin = async (req, res) => {
  try {
    const userData = { ...req.body, role: "admin" };
    if (req.file) userData.image_User = req.file.filename;

    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "Admin créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Créer un ENSEIGNANT
module.exports.createEnseignant = async (req, res) => {
  try {
    const userData = { ...req.body, role: "enseignant" };
    if (req.file) userData.image_User = req.file.filename;

    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "Enseignant créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Créer un ÉTUDIANT
module.exports.createEtudiant = async (req, res) => {
  try {
    const userData = { ...req.body, role: "etudiant" };
    if (req.file) userData.image_User = req.file.filename;

    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "Étudiant créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ------------------- GET USERS -------------------
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports.getAdmins = async (req, res) => {
  try {
    const admins = await userModel.find({ role: "admin" }).select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports.getEnseignants = async (req, res) => {
  try {
    const enseignants = await userModel.find({ role: "enseignant" }).select("-password");
    res.status(200).json(enseignants);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports.getEtudiants = async (req, res) => {
  try {
    const etudiants = await userModel.find({ role: "etudiant" }).select("-password");
    res.status(200).json(etudiants);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
//get userbyid
module.exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Chercher l'utilisateur
    const user = await userModel.findById(id).select('-password'); 

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // ✅ Retourner l'utilisateur trouvé
    res.status(200).json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur", error });
  }
};

// ------------------- UPDATE USER -------------------
module.exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      const user = await userModel.findById(id);
      if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

      if (user.image_User) await deleteImageFile(user.image_User);

      updateData.image_User = req.file.filename;
    }

    const user = await userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    res.status(200).json({ message: "Utilisateur mis à jour", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ------------------- UPDATE PASSWORD -------------------
module.exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // 🔍 Trouver l'utilisateur
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // 🔑 Vérifier l'ancien mot de passe
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect." });
    }

    // 🔒 Vérifier la force du nouveau mot de passe
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
      });
    }

    // 🔁 Mettre à jour le mot de passe (hash automatique via pre('save'))
    user.password = newPassword;
    await user.save();

    // 📧 Envoi d’un email de confirmation
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🔐 Votre mot de passe a été changé',
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

// ------------------- DELETE USER -------------------
module.exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (user.image_User) await deleteImageFile(user.image_User);

    await userModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ------------------- HELPER -------------------
const deleteImageFile = async (filename) => {
  if (!filename || filename === 'default.png' || filename === 'placeholder.jpg') return;

  const filePath = path.join(__dirname, '..', 'public', 'images', filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Erreur suppression fichier image:', err);
  }
};
