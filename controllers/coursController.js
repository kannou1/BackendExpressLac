const Cours = require("../models/coursSchema");

// Create
exports.createCours = async (req, res) => {
  try {
    const newCours = await Cours.create(req.body);
    res.status(201).json(newCours);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Cours code must be unique." });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get all
exports.getAllCours = async (req, res) => {
  try {
    const cours = await Cours.find();
    res.status(200).json(cours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID
exports.getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) return res.status(404).json({ message: "Cours not found" });
    res.status(200).json(cours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
exports.updateCours = async (req, res) => {
  try {
    const updatedCours = await Cours.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCours) return res.status(404).json({ message: "Cours not found" });
    res.status(200).json(updatedCours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
exports.deleteCours = async (req, res) => {
  try {
    const deletedCours = await Cours.findByIdAndDelete(req.params.id);
    if (!deletedCours) return res.status(404).json({ message: "Cours not found" });
    res.status(200).json({ message: "Cours deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all
exports.deleteAllCours = async (req, res) => {
  try {
    const result = await Cours.deleteMany({});
    res.status(200).json({
      message: "All cours deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
