const express = require("express");
const router = express.Router();
const stageRequestController = require("../controllers/stageRequestController");

router.post("/create", stageRequestController.createStageRequest);
router.get("/getAll", stageRequestController.getAllStageRequests);
router.get("/getById/:id", stageRequestController.getStageRequestById);
router.put("/update/:id", stageRequestController.updateStageRequest);
router.delete("/delete/:id", stageRequestController.deleteStageRequest);
router.delete("/deleteAll", stageRequestController.deleteAllStageRequests);

module.exports = router;
