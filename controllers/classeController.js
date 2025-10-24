const Classe = require("../models/classeSchema");

// 🟢 Create
exports.createClasse = async (req, res) => {
  try {
    const newClasse = await Classe.create(req.body);
    res.status(201).json(newClasse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔵 Get All
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Classe.find();
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟡 Get by ID
exports.getClasseById = async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id);
    if (!classe) return res.status(404).json({ message: "Classe not found" });
    res.status(200).json(classe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Update
exports.updateClasse = async (req, res) => {
  try {
    const updatedClasse = await Classe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedClasse) return res.status(404).json({ message: "Classe not found" });
    res.status(200).json(updatedClasse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔴 Delete
exports.deleteClasse = async (req, res) => {
  try {
    const deletedClasse = await Classe.findByIdAndDelete(req.params.id);
    if (!deletedClasse) return res.status(404).json({ message: "Classe not found" });
    res.status(200).json({ message: "Classe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// 🛑 Delete all classes
exports.deleteAllClasses = async (req, res) => {
  try {
    const result = await Classe.deleteMany({});
    res.status(200).json({
      message: `All classes deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};