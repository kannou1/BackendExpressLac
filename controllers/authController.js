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
  subject: '🔒 Réinitialisation de votre mot de passe',
  html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
    <h2 style="color: #333; text-align: center;">EduNex</h2>
    <p>Bonjour <strong>${user.prenom}</strong>,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous pour procéder :</p>

    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; color: #ffffff; background-color: #4F46E5; padding: 10px 20px; border-radius: 8px;">${resetCode}</span>
    </div>

    <p>Ce code est valide pendant <strong>10 minutes</strong>.</p>
    <p style="font-size: 12px; color: #888;">Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
    <p style="text-align: center; font-size: 12px; color: #888;">© 2025 EduNex. Tous droits réservés.</p>
  </div>
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
  subject: '✅ Mot de passe réinitialisé avec succès',
  html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f3f4f6; text-align: center;">
    <h2 style="color: #4F46E5;">EduNex</h2>
    <p>Bonjour <strong>${user.prenom}</strong>,</p>
    <p>Votre mot de passe a été réinitialisé avec succès ! 🎉</p>
    <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>

    <a href="http://localhost:3000/login" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #4F46E5; color: #fff; text-decoration: none; border-radius: 6px;">Se connecter</a>

    <p style="font-size: 12px; color: #666;">Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement l'administrateur.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #d1d5db;">
    <p style="font-size: 12px; color: #888;">© 2025 EduNex. Tous droits réservés.</p>
  </div>
  `,
});


    res.status(200).json({ message: "Mot de passe réinitialisé avec succès et email de confirmation envoyé !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe." });
  }
};
