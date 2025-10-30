const Demande = require("../models/demandeSchema");
const User = require("../models/userSchema");

/* ===========================================================
   🟢 CREATE DEMANDE (Créer une demande d’attestation, etc.)
=========================================================== */
module.exports.createDemande = async (req, res) => {
  try {
    const { nom, type, etudiant } = req.body;

    if (!nom || !type || !etudiant) {
      return res.status(400).json({ message: "Nom, type et étudiant sont obligatoires." });
    }

    // Vérifier si l’étudiant existe
    const student = await User.findById(etudiant);
    if (!student || student.role !== "etudiant") {
      return res.status(404).json({ message: "Étudiant introuvable ou rôle invalide." });
    }

    // Créer la demande
    const newDemande = new Demande({
      nom,
      type,
      etudiant,
      statut: "en_attente",
    });
    await newDemande.save();

    // Ajouter l’ID de la demande à la liste des demandes de l’étudiant
    await User.findByIdAndUpdate(etudiant, {
      $addToSet: { demandes: newDemande._id },
    });

    res.status(201).json({
      message: "Demande créée avec succès ✅",
      demande: newDemande,
    });
  } catch (error) {
    console.error("❌ Erreur createDemande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔵 GET ALL DEMANDES
=========================================================== */
module.exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find()
      .populate("etudiant", "prenom nom email classe")
      .sort({ createdAt: -1 });

    res.status(200).json(demandes);
  } catch (error) {
    console.error("❌ Erreur getAllDemandes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET DEMANDE BY ID
=========================================================== */
module.exports.getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate("etudiant", "prenom nom email classe");

    if (!demande) return res.status(404).json({ message: "Demande introuvable." });

    res.status(200).json(demande);
  } catch (error) {
    console.error("❌ Erreur getDemandeById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🟠 UPDATE DEMANDE (changer statut : approuvée / rejetée)
=========================================================== */
module.exports.updateDemande = async (req, res) => {
  try {
    const { statut } = req.body;

    if (!["en_attente", "approuvee", "rejete"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const updatedDemande = await Demande.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    );

    if (!updatedDemande) return res.status(404).json({ message: "Demande introuvable." });

    res.status(200).json({
      message: "Statut de la demande mis à jour ✅",
      demande: updatedDemande,
    });
  } catch (error) {
    console.error("❌ Erreur updateDemande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔴 DELETE DEMANDE
=========================================================== */
module.exports.deleteDemande = async (req, res) => {
  try {
    const deleted = await Demande.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Demande introuvable." });

    // Retirer la demande du tableau de l’étudiant
    await User.findByIdAndUpdate(deleted.etudiant, {
      $pull: { demandes: deleted._id },
    });

    res.status(200).json({ message: "Demande supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteDemande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🧨 DELETE ALL DEMANDES
=========================================================== */
module.exports.deleteAllDemandes = async (req, res) => {
  try {
    await Demande.deleteMany({});
    await User.updateMany({}, { $set: { demandes: [] } });

    res.status(200).json({ message: "Toutes les demandes ont été supprimées ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllDemandes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
