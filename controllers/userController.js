const userModel = require("../models/userSchema");



//  Créer un ADMIN
module.exports.createAdmin = async (req, res) => {
  try {
    const userData = { ...req.body };
    if (req.file) {
      userData.image_User = req.file.filename;
    }
    userData.role = "admin";
    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "Admin créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  Créer un ENSEIGNANT
module.exports.createEnseignant = async (req, res) => {
  try {
    const userData = { ...req.body };
    if (req.file) {
      userData.image_User = req.file.filename;
    }
    userData.role = "enseignant";
    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "Enseignant créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  Créer un ÉTUDIANT
module.exports.createEtudiant = async (req, res) => {
  try {
    const userData = { ...req.body };
    if (req.file) {
      userData.image_User = req.file.filename;
    }
    userData.role = "etudiant";
    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "Étudiant créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  GET ALL USERS
module.exports.getAllUsers = async (req, res) => {
  try { 
    const users = await userModel.find().select("-password");
     res.status(200).json(users); 
    }
  catch (error) { res.status(500).json({ message: "❌ Erreur serveur", error });
 }
};

//  GET USERS BY ROLE
module.exports.getAdmins = async (req, res) => {
  try { 
    const admins = await userModel.find({ role: "admin" }).select("-password");
     res.status(200).json(admins); 
    }
  catch (error) { 
    res.status(500).json({ message: "❌ Erreur serveur", error }); 
  }
};

module.exports.getEnseignants = async (req, res) => {
  try { 
    const enseignants = await userModel.find({ role: "enseignant" }).select("-password"); 
    res.status(200).json(enseignants); }
  catch (error) { 
    res.status(500).json({ message: "❌ Erreur serveur", error });
   }
};

module.exports.getEtudiants = async (req, res) => {
  try { 
    const etudiants = await userModel.find({ role: "etudiant" }).select("-password"); 
    res.status(200).json(etudiants);
   }
   catch (error) { 
    res.status(500).json({ message: "❌ Erreur serveur", error }); 
  }
};

// 🔧 UPDATE


module.exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If an image file is uploaded, update the image_User field
    if (req.file) {
      updateData.image_User = req.file.filename;
    }
    // Update the user
    const user = await userModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    res.status(200).json({ message: "✅ Utilisateur mis à jour", user });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur serveur", error });
  }
};


//  DELETE
module.exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.status(200).json({ message: "🗑️ Utilisateur supprimé avec succès" });
  } catch (error) { 
    res.status(500).json({ message: "❌ Erreur serveur", error });
   }
};
