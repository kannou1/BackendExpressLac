const Note = require("../models/noteSchema");
const User = require("../models/userSchema");
const Examen = require("../models/examenSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🧠 FONCTION UTILITAIRE : envoyer une notification
=========================================================== */
async function sendNotification(io, userId, message, type = "note") {
  if (!userId) return;

  // Enregistrer la notification dans MongoDB
  const notif = await Notification.create({
    message,
    type,
    utilisateur: userId,
  });

  // Ajouter la notif à la liste du user
  await User.findByIdAndUpdate(userId, { $push: { notifications: notif._id } });

  // Envoi en temps réel via Socket.IO
  if (io) {
    io.to(userId.toString()).emit("receiveNotification", {
      message,
      type,
      date: new Date(),
    });
    console.log(`📢 Notification envoyée à ${userId}:`, message);
  } else {
    console.warn("⚠️ io non trouvé — notification non envoyée en direct");
  }
}

/* ===========================================================
   🟢 CREATE NOTE
=========================================================== */
module.exports.createNote = async (req, res) => {
  try {
    const { score, examen, etudiant, enseignant } = req.body;
    const io = req.io || req.app?.get("io");

    if (!score || !examen || !etudiant || !enseignant)
      return res.status(400).json({ message: "Score, examen, étudiant et enseignant obligatoires." });

    const [etudiantData, enseignantData, examenData] = await Promise.all([
      User.findById(etudiant),
      User.findById(enseignant),
      Examen.findById(examen),
    ]);

    if (!etudiantData) return res.status(404).json({ message: "Étudiant introuvable." });
    if (!enseignantData || enseignantData.role !== "enseignant")
      return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });
    if (!examenData) return res.status(404).json({ message: "Examen introuvable." });

    const newNote = await Note.create({ score, examen, etudiant, enseignant });

    await Promise.all([
      User.findByIdAndUpdate(etudiant, { $addToSet: { notes: newNote._id } }),
      User.findByIdAndUpdate(enseignant, { $addToSet: { notes: newNote._id } }),
      Examen.findByIdAndUpdate(examen, { $addToSet: { notes: newNote._id } }),
    ]);

    // 🔔 Notification : création
    await sendNotification(
      io,
      etudiant,
      `📝 Nouvelle note ajoutée pour "${examenData.nom}" : ${score}/${examenData.noteMax}`,
      "note"
    );

    res.status(201).json({ message: "Note ajoutée avec succès ✅", note: newNote });
  } catch (error) {
    console.error("❌ Erreur createNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE NOTE
=========================================================== */
module.exports.updateNote = async (req, res) => {
  try {
    const io = req.io || req.app?.get("io");
    const updated = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("etudiant")
      .populate("examen");

    if (!updated) return res.status(404).json({ message: "Note introuvable." });

    // 🔔 Notification : mise à jour
    await sendNotification(
      io,
      updated.etudiant._id,
      `✏️ Votre note pour "${updated.examen.nom}" a été mise à jour : ${updated.score}/${updated.examen.noteMax}`,
      "note"
    );

    res.status(200).json({ message: "Note mise à jour ✅", note: updated });
  } catch (error) {
    console.error("❌ Erreur updateNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE NOTE
=========================================================== */
module.exports.deleteNote = async (req, res) => {
  try {
    const io = req.io || req.app?.get("io");
    const deleted = await Note.findByIdAndDelete(req.params.id)
      .populate("etudiant")
      .populate("examen");

    if (!deleted) return res.status(404).json({ message: "Note introuvable." });

    await Promise.all([
      User.updateMany({}, { $pull: { notes: deleted._id } }),
      Examen.updateMany({}, { $pull: { notes: deleted._id } }),
    ]);

    // 🔔 Notification : suppression
    await sendNotification(
      io,
      deleted.etudiant._id,
      `🗑️ Votre note pour "${deleted.examen.nom}" a été supprimée.`,
      "note"
    );

    res.status(200).json({ message: "Note supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL + BY ID (inchangés)
=========================================================== */
module.exports.getAllNotes = async (_, res) => {
  try {
    const notes = await Note.find()
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "examen",
        select: "nom type date noteMax",
        populate: { path: "coursId", select: "nom code credits semestre" },
      });

    res.status(200).json(notes);
  } catch (error) {
    console.error("❌ Erreur getAllNotes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "examen",
        select: "nom type date noteMax",
        populate: { path: "coursId", select: "nom code credits semestre" },
      });

    if (!note) return res.status(404).json({ message: "Note introuvable." });
    res.status(200).json(note);
  } catch (error) {
    console.error("❌ Erreur getNoteById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
