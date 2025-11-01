const Message = require("../models/messageSchema");
const User = require("../models/userSchema");
const path = require("path");
const fs = require("fs");

/* ===========================================================
   🟢 CREATE MESSAGE (texte ou image)
=========================================================== */
module.exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    let image = null;

    // 🧩 Validation
    if (!senderId || !receiverId || (!text && !req.file)) {
      return res
        .status(400)
        .json({ message: "Expéditeur, destinataire et contenu requis." });
    }

    // Vérifier que les deux utilisateurs existent
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res
        .status(404)
        .json({ message: "Utilisateur expéditeur ou destinataire introuvable." });
    }

    // 🖼️ Gestion du fichier image (si envoyé)
    if (req.file) {
      image = req.file.filename;
    }

    // ✅ Créer le message
    const newMessage = new Message({
      senderId,
      receiverId, // ✅ corrigé ici
      text: text?.trim() || "",
      image,
    });

    await newMessage.save();

    // 🔗 Ajouter la référence dans les deux utilisateurs
    await Promise.all([
      User.findByIdAndUpdate(senderId, { $push: { messages: newMessage._id } }),
      User.findByIdAndUpdate(receiverId, { $push: { messages: newMessage._id } }),
    ]);

    res.status(201).json({
      message: "Message envoyé avec succès ✅",
      data: newMessage,
    });
  } catch (error) {
    console.error("❌ Erreur sendMessage:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL MESSAGES (admin)
=========================================================== */
module.exports.getAllMessages = async (_, res) => {
  try {
    const messages = await Message.find()
      .populate("senderId", "prenom nom email image_User")
      .populate("receiverId", "prenom nom email image_User")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Erreur getAllMessages:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   💬 GET CHAT BETWEEN TWO USERS
=========================================================== */
module.exports.getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    if (!userId1 || !userId2) {
      return res
        .status(400)
        .json({ message: "Deux utilisateurs sont requis pour la conversation." });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .populate("senderId", "prenom nom email image_User")
      .populate("receiverId", "prenom nom email image_User")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Erreur getConversation:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE MESSAGE
=========================================================== */
module.exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const updated = await Message.findByIdAndUpdate(id, { text }, { new: true });
    if (!updated)
      return res.status(404).json({ message: "Message introuvable." });

    res.status(200).json({ message: "Message mis à jour ✅", data: updated });
  } catch (error) {
    console.error("❌ Erreur updateMessage:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE MESSAGE
=========================================================== */
module.exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message)
      return res.status(404).json({ message: "Message introuvable." });

    await Promise.all([
      User.updateMany({}, { $pull: { messages: message._id } }),
    ]);

    // 🖼️ Supprimer l'image si elle existe
    if (message.image) {
      const filePath = path.join(__dirname, "..", "public", "images", message.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({ message: "Message supprimé ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteMessage:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ⚠️ DELETE ALL MESSAGES
=========================================================== */
module.exports.deleteAllMessages = async (req, res) => {
  try {
    await Message.deleteMany({});
    await User.updateMany({}, { $set: { messages: [] } });

    res.status(200).json({ message: "Tous les messages supprimés ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllMessages:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
