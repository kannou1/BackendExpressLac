const User = require('../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// 🌐 1. FORGOT PASSWORD (envoi du code alphanumérique)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email" });

    // Générer un code alphanumérique à 6 caractères
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resetCode = '';
    for (let i = 0; i < 6; i++) {
      resetCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Stocker le code et sa date d'expiration (10 min)
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min
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
      subject: 'Code de vérification pour réinitialiser votre mot de passe',
      html: `
        <h2>Bonjour ${user.prenom},</h2>
        <p>Voici votre code de vérification pour réinitialiser votre mot de passe :</p>
        <h3>${resetCode}</h3>
        <p>Ce code expirera dans 10 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Code de vérification envoyé par email !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'envoi du code." });
  }
};

// 🌐 2. RESET PASSWORD (avec code alphanumérique)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (!user.resetCode || user.resetCode !== code)
      return res.status(400).json({ message: "Code invalide." });
    if (user.resetCodeExpires < Date.now())
      return res.status(400).json({ message: "Le code a expiré." });

    // Hash du nouveau mot de passe
    user.password = await bcrypt.hash(newPassword, 10);

    // Supprimer le code après usage
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe." });
  }
};
