const EmploiDuTemps = require("../models/emploiDuTempsSchema");

// CREATE
module.exports.createEmploiDuTemps = async (req, res) => {
  try {
    const newEDT = await EmploiDuTemps.create(req.body);
    res.status(201).json(newEDT);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL
module.exports.getAllEmploiDuTemps = async (req, res) => {
  try {
    const edt = await EmploiDuTemps.find().populate("cours");
    res.status(200).json(edt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BY ID
module.exports.getEmploiDuTempsById = async (req, res) => {
  try {
    const edt = await EmploiDuTemps.findById(req.params.id).populate("cours");
    if (!edt) return res.status(404).json({ message: "Emploi du temps introuvable" });
    res.status(200).json(edt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
module.exports.updateEmploiDuTemps = async (req, res) => {
  try {
    const updatedEDT = await EmploiDuTemps.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEDT) return res.status(404).json({ message: "Emploi du temps introuvable" });
    res.status(200).json(updatedEDT);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
module.exports.deleteEmploiDuTemps = async (req, res) => {
  try {
    const deletedEDT = await EmploiDuTemps.findByIdAndDelete(req.params.id);
    if (!deletedEDT) return res.status(404).json({ message: "Emploi du temps introuvable" });
    res.status(200).json({ message: "Emploi du temps supprimé avec succès ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ALL
module.exports.deleteAllEmploiDuTemps = async (req, res) => {
  try {
    const result = await EmploiDuTemps.deleteMany({});
    res.status(200).json({
      message: "Tous les emplois du temps supprimés ✅",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
