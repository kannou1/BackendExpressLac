const userModel = require("../models/userSchema");

// 🟢 Créer un ADMIN
module.exports.createAdmin = async (req, res) => {
  try {
    const { nom, prenom, email, password, age, adminCode } = req.body;
    const newUser = new userModel({ nom, prenom, email, password, age, role: "admin", adminCode });
    await newUser.save();
    res.status(201).json({ newUser, message: "✅ Admin créé avec succès" });
  } catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

// 🟣 Créer un ENSEIGNANT
module.exports.createEnseignant = async (req, res) => {
  try {
    const { nom, prenom, email, password, age, specialite, dateEmbauche, NumTelEnseignant } = req.body;
    const newUser = new userModel({ nom, prenom, email, password, age, role: "enseignant", specialite, dateEmbauche, NumTelEnseignant });
    await newUser.save();
    res.status(201).json({ newUser, message: "✅ Enseignant créé avec succès" });
  } catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

// 🟢 Créer un ÉTUDIANT
module.exports.createEtudiant = async (req, res) => {
  try {
    const { nom, prenom, email, password, age, NumTel, Adresse, datedeNaissance, classe, dateInscription } = req.body;
    const newUser = new userModel({ nom, prenom, email, password, age, role: "etudiant", NumTel, Adresse, datedeNaissance, classe, dateInscription });
    await newUser.save();
    res.status(201).json({ newUser, message: "✅ Étudiant créé avec succès" });
  } catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

// 🔵 GET ALL USERS
module.exports.getAllUsers = async (req, res) => {
  try { const users = await userModel.find().select("-password"); res.status(200).json(users); }
  catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

// 🔵 GET USERS BY ROLE
module.exports.getAdmins = async (req, res) => {
  try { const admins = await userModel.find({ role: "admin" }).select("-password"); res.status(200).json(admins); }
  catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

module.exports.getEnseignants = async (req, res) => {
  try { const enseignants = await userModel.find({ role: "enseignant" }).select("-password"); res.status(200).json(enseignants); }
  catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

module.exports.getEtudiants = async (req, res) => {
  try { const etudiants = await userModel.find({ role: "etudiant" }).select("-password"); res.status(200).json(etudiants); }
  catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

// 🔧 UPDATE
module.exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.status(200).json({ message: "✅ Utilisateur mis à jour", user });
  } catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};

// 🔴 DELETE
module.exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.status(200).json({ message: "🗑️ Utilisateur supprimé avec succès" });
  } catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error }); }
};
