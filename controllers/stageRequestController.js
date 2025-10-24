const StageRequest = require("../models/stageRequestSchema");

// Create
exports.createStageRequest = async (req, res) => {
  try {
    const newRequest = await StageRequest.create(req.body);
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all
exports.getAllStageRequests = async (req, res) => {
  try {
    const requests = await StageRequest.find();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get by ID
exports.getStageRequestById = async (req, res) => {
  try {
    const request = await StageRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "StageRequest not found" });
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update
exports.updateStageRequest = async (req, res) => {
  try {
    const updatedRequest = await StageRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRequest) return res.status(404).json({ message: "StageRequest not found" });
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete
exports.deleteStageRequest = async (req, res) => {
  try {
    const deletedRequest = await StageRequest.findByIdAndDelete(req.params.id);
    if (!deletedRequest) return res.status(404).json({ message: "StageRequest not found" });
    res.status(200).json({ message: "StageRequest deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all
exports.deleteAllStageRequests = async (req, res) => {
  try {
    const result = await StageRequest.deleteMany({});
    res.status(200).json({
      message: "All stage requests deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
