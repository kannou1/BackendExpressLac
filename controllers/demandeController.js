const Demande = require("../models/demandeSchema");

// Create
module.exports.createDemande = async (req, res) => {
  try {
    const newDemande = await Demande.create(req.body);
    res.status(201).json(newDemande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all
module.exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find().populate("etudiant");
    res.status(200).json(demandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID
module.exports.getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id).populate("etudiant");
    if (!demande) return res.status(404).json({ message: "Demande not found" });
    res.status(200).json(demande);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update
module.exports.updateDemande = async (req, res) => {
  try {
    const updatedDemande = await Demande.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDemande) return res.status(404).json({ message: "Demande not found" });
    res.status(200).json(updatedDemande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
module.exports.deleteDemande = async (req, res) => {
  try {
    const deletedDemande = await Demande.findByIdAndDelete(req.params.id);
    if (!deletedDemande) return res.status(404).json({ message: "Demande not found" });
    res.status(200).json({ message: "Demande deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all
module.exports.deleteAllDemandes = async (req, res) => {
  try {
    const result = await Demande.deleteMany({});
    res.status(200).json({
      message: "All demandes deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
