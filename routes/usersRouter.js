var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const uploadfile = require('../middlewares/uploadfile');
const { forgotPassword, resetPassword } = require('../controllers/authController');





//  CREATE avec upload d'image
router.post("/create-admin", uploadfile.single("image_User"), userController.createAdmin);
router.post("/create-enseignant", uploadfile.single("image_User"), userController.createEnseignant);
router.post("/create-etudiant", uploadfile.single("image_User"), userController.createEtudiant);

//  READ
router.get("/getAllUsers", userController.getAllUsers);
router.get("/admins", userController.getAdmins);
router.get("/enseignants", userController.getEnseignants);
router.get("/etudiants", userController.getEtudiants);
router.get("/getUserById/:id", userController.getUserById);

//  UPDATE
router.put("/update/:id", userController.updateUserById);
router.put("/update-password/:id", userController.updatePassword);

//  DELETE
router.delete("/deleteAllUsers", userController.deleteAllUsers);
router.delete("/delete/:id", userController.deleteUserById);
// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password/', resetPassword);


module.exports = router;
