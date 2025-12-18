const router = require("express").Router();
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");
const { chat } = require("../controllers/chat.controller");

router.post("/", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), chat);

module.exports = router;
