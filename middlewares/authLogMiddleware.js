const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const userModel = require("../models/userSchema");

/**
 * 🧾 Middleware de journalisation (authLogMiddleware)
 * Log chaque requête authentifiée avec infos utilisateur, IP, temps d'exécution, etc.
 */
async function authLogMiddleware(req, res, next) {
  const token =
    req.cookies?.jwt ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  const startTime = Date.now();
  const originalSend = res.send;

  // 🧠 Capture la réponse envoyée
  res.send = function (body) {
    res.locals.body = body;
    return originalSend.call(this, body);
  };

  // 🕒 Quand la réponse est terminée
  res.on("finish", async () => {
    let user = null;

    // ✅ Décodage du token si présent
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await userModel
          .findById(decoded.id)
          .select("nom prenom email role _id");
      } catch (err) {
        user = null;
      }
    }

    // 🔒 Masquer les champs sensibles dans le body
    const safeBody = { ...req.body };
    ["password", "newPassword", "oldPassword"].forEach((key) => {
      if (safeBody[key]) safeBody[key] = "****";
    });

    // 🕑 Temps d’exécution et chemin du fichier de log
    const executionTime = Date.now() - startTime;
    const logsDir = path.join(__dirname, "..", "logs");
    const logPath = path.join(logsDir, "auth.log");

    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

    // 🧩 Contenu du log
    const logLines = [
      `📅 ${new Date().toISOString()}`,
      `➡️  ${req.method} ${req.originalUrl}`,
      `🌐 IP: ${req.ip}`,
      `⏱️  ${executionTime}ms`,
      `📊 Status: ${res.statusCode}`,
      user
        ? `👤 ${user.prenom} ${user.nom} <${user.email}> [${user.role}] (ID: ${user._id})`
        : "👤 Anonymous",
      `🧾 Body: ${Object.keys(safeBody).length ? JSON.stringify(safeBody) : "N/A"}`,
      "------------------------------------------------------------",
    ];

    // ✍️ Écriture dans le fichier
    try {
      fs.appendFileSync(logPath, logLines.join(" | ") + "\n");
    } catch (err) {
      console.error("❌ Erreur écriture log :", err.message);
    }
  });

  next();
}

module.exports = authLogMiddleware;
