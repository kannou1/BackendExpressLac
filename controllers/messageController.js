const Message = require("../models/messageSchema");

// Create
module.exports.createMessage = async (req, res) => {
  try {
    const newMessage = await Message.create(req.body);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all
module.exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("expediteur", "prenom nom email")
      .populate("destinataire", "prenom nom email");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID
module.exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate("expediteur", "prenom nom email")
      .populate("destinataire", "prenom nom email");
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
module.exports.updateMessage = async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMessage) return res.status(404).json({ message: "Message not found" });
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
module.exports.deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage) return res.status(404).json({ message: "Message not found" });
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all
module.exports.deleteAllMessages = async (req, res) => {
  try {
    const result = await Message.deleteMany({});
    res.status(200).json({
      message: "All messages deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
