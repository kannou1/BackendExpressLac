const User = require('../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// 🌐 1. FORGOT PASSWORD (envoi du code sécurisé)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email" });

    // Générer un code sécurisé à 8 caractères (lettres, chiffres, spéciaux)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let resetCode = '';
    for (let i = 0; i < 8; i++) {
      resetCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Stocker le code et sa date d'expiration (10 min) + compteur de tentatives
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min
    user.resetAttempts = 0;
    await user.save();

    // Envoyer le code par email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Code sécurisé pour réinitialiser votre mot de passe',
      html: `
        <h2>Bonjour ${user.prenom},</h2>
        <p>Voici votre code sécurisé pour réinitialiser votre mot de passe :</p>
        <h3>${resetCode}</h3>
        <p>Ce code expirera dans 10 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Code sécurisé envoyé à ${user.email}: ${resetCode}`);
    res.status(200).json({ message: "Code sécurisé envoyé par email !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'envoi du code." });
  }
};

// 🌐 2. RESET PASSWORD (avec code sécurisé)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Vérification du code et expiration
    if (!user.resetCode || user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Le code a expiré ou est invalide." });
    }

    if (user.resetAttempts >= 5) {
      return res.status(429).json({ message: "Nombre maximal de tentatives dépassé." });
    }

    if (user.resetCode.toUpperCase() !== code.toUpperCase()) {
      user.resetAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Code invalide." });
    }

    // Validation forte du nouveau mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      });
    }

    // Hash du nouveau mot de passe
    user.password = await bcrypt.hash(newPassword, 10);

    // Supprimer le code après usage
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    user.resetAttempts = undefined;
    await user.save();

    // Envoyer un email de confirmation
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
      subject: 'Votre mot de passe a été réinitialisé avec succès',
      html: `
        <h2>Bonjour ${user.prenom},</h2>
        <p>Votre mot de passe a été réinitialisé avec succès !</p>
        <p>Si vous n'êtes pas à l'origine de ce changement, veuillez contacter l'administrateur immédiatement.</p>
      `,
    });

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès et email de confirmation envoyé !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe." });
  }
};
