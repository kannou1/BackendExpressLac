const Examen = require("../models/examenSchema");

// Create
module.exports.createExamen = async (req, res) => {
  try {
    const newExamen = await Examen.create(req.body);
    res.status(201).json(newExamen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all
module.exports.getAllExamen = async (req, res) => {
  try {
    const examens = await Examen.find()
      .populate("cours")
      .populate("notes");
    res.status(200).json(examens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID

module.exports.getExamenById = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id)
      .populate("cours")
      .populate("notes");
    if (!examen) return res.status(404).json({ message: "Examen not found" });
    res.status(200).json(examen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update
module.exports.updateExamen = async (req, res) => {
  try {
    const updatedExamen = await Examen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedExamen) return res.status(404).json({ message: "Examen not found" });
    res.status(200).json(updatedExamen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
module.exports.deleteExamen = async (req, res) => {
  try {
    const deletedExamen = await Examen.findByIdAndDelete(req.params.id);
    if (!deletedExamen) return res.status(404).json({ message: "Examen not found" });
    res.status(200).json({ message: "Examen deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all
module.exports.deleteAllExamen = async (req, res) => {
  try {
    const result = await Examen.deleteMany({});
    res.status(200).json({
      message: "All examens deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
