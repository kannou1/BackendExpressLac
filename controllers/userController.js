const userModel = require("../models/userSchema");
const fs = require("fs");
const path = require("path"); 



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
  catch (error) { res.status(500).json({ message: " Erreur serveur", error });
 }
};

//  GET USERS BY ROLE
module.exports.getAdmins = async (req, res) => {
  try { 
    const admins = await userModel.find({ role: "admin" }).select("-password");
     res.status(200).json(admins); 
    }
  catch (error) { 
    res.status(500).json({ message: " Erreur serveur", error }); 
  }
};

module.exports.getEnseignants = async (req, res) => {
  try { 
    const enseignants = await userModel.find({ role: "enseignant" }).select("-password"); 
    res.status(200).json(enseignants); }
  catch (error) { 
    res.status(500).json({ message: " Erreur serveur", error });
   }
};

module.exports.getEtudiants = async (req, res) => {
  try { 
    const etudiants = await userModel.find({ role: "etudiant" }).select("-password"); 
    res.status(200).json(etudiants);
   }
   catch (error) { 
    res.status(500).json({ message: " Erreur serveur", error }); 
  }
};

// UPDATE: si on remplace l'image, supprimer l'ancienne image du disque
module.exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Si new image uploaded, on récupère l'utilisateur pour supprimer l'ancienne image
    if (req.file) {
      const user = await userModel.findById(id);
      if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

      // supprimer ancienne image (si présente)
      if (user.image_User) {
        await deleteImageFile(user.image_User);
      }

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
// helper pour supprimer une image si elle existe
const deleteImageFile = async (filename) => {
  if (!filename) return;
  
  if (filename === 'default.png' || filename === 'placeholder.jpg') return;

  const filePath = path.join(__dirname, '..', 'public', 'images', filename);
  try {
    await fs.promises.unlink(filePath);
    
  } catch (err) {
    
    if (err.code !== 'ENOENT') {
      console.error('Erreur suppression fichier image:', err);
    }
  }
};

// DELETE utilisateur (supprime aussi l'image du disque)
module.exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // Récupérer l'utilisateur pour connaître le nom du fichier image
    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Supprimer l'image si elle existe
    if (user.image_User) {
      await deleteImageFile(user.image_User);
    }

    // Supprimer le document
    await userModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
