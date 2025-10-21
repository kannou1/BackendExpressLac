const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// 🟢 CREATE
router.post("/create-admin", userController.createAdmin);
router.post("/create-enseignant", userController.createEnseignant);
router.post("/create-etudiant", userController.createEtudiant);

// 🔵 READ
router.get("/all", userController.getAllUsers);
router.get("/admins", userController.getAdmins);
router.get("/enseignants", userController.getEnseignants);
router.get("/etudiants", userController.getEtudiants);

// 🔧 UPDATE
router.put("/update/:id", userController.updateUserById);

// 🔴 DELETE
router.delete("/delete/:id", userController.deleteUserById);

module.exports = router;
