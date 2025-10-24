const Presence = require("../models/presenceSchema");

// Create
exports.createPresence = async (req, res) => {
  try {
    const newPresence = await Presence.create(req.body);
    res.status(201).json(newPresence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all
exports.getAllPresence = async (req, res) => {
  try {
    const presences = await Presence.find();
    res.status(200).json(presences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID
exports.getPresenceById = async (req, res) => {
  try {
    const presence = await Presence.findById(req.params.id);
    if (!presence) return res.status(404).json({ message: "Presence not found" });
    res.status(200).json(presence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
exports.updatePresence = async (req, res) => {
  try {
    const updatedPresence = await Presence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPresence) return res.status(404).json({ message: "Presence not found" });
    res.status(200).json(updatedPresence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
exports.deletePresence = async (req, res) => {
  try {
    const deletedPresence = await Presence.findByIdAndDelete(req.params.id);
    if (!deletedPresence) return res.status(404).json({ message: "Presence not found" });
    res.status(200).json({ message: "Presence deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all
exports.deleteAllPresence = async (req, res) => {
  try {
    const result = await Presence.deleteMany({});
    res.status(200).json({
      message: "All presences deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
