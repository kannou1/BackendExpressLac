var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const uploadfile = require('../middlewares/uploadfile');

//  CREATE avec upload d'image
router.post("/create-admin", uploadfile.single("image_User"), userController.createAdmin);
router.post("/create-enseignant", uploadfile.single("image_User"), userController.createEnseignant);
router.post("/create-etudiant", uploadfile.single("image_User"), userController.createEtudiant);

//  READ
router.get("/all", userController.getAllUsers);
router.get("/admins", userController.getAdmins);
router.get("/enseignants", userController.getEnseignants);
router.get("/etudiants", userController.getEtudiants);

//  UPDATE
router.put("/update/:id", uploadfile.single("image_User"), userController.updateUserById);

//  DELETE
router.delete("/delete/:id", userController.deleteUserById);

module.exports = router;
