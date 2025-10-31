const Presence = require("../models/presenceSchema");
const User = require("../models/userSchema");
const Cours = require("../models/coursSchema");

/* ===========================================================
   🟢 CREATE PRESENCE
=========================================================== */
module.exports.createPresence = async (req, res) => {
  try {
    const { date, statut, cours, etudiant, enseignant } = req.body;

    if (!date || !statut || !cours || !etudiant) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
    }

    // Vérifier que le cours et l'étudiant existent
    const [coursData, etudiantData] = await Promise.all([
      Cours.findById(cours),
      User.findById(etudiant),
    ]);

    if (!coursData) return res.status(404).json({ message: "Cours introuvable." });
    if (!etudiantData || etudiantData.role !== "etudiant")
      return res.status(400).json({ message: "Étudiant introuvable ou rôle invalide." });

    // Vérifier l'enseignant si fourni
    let enseignantData = null;
    if (enseignant) {
      enseignantData = await User.findById(enseignant);
      if (!enseignantData || enseignantData.role !== "enseignant") {
        return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });
      }
    }

    // ✅ Créer la présence
    const newPresence = new Presence({
      date,
      statut,
      cours,
      etudiant,
      enseignant: enseignant || null,
    });

    await newPresence.save();

    // 🔗 Ajouter les références
    await Promise.all([
      User.findByIdAndUpdate(etudiant, { $addToSet: { presences: newPresence._id } }),
      Cours.findByIdAndUpdate(cours, { $addToSet: { presences: newPresence._id } }),
    ]);

    res.status(201).json({ message: "Présence enregistrée avec succès ✅", presence: newPresence });
  } catch (error) {
    console.error("❌ Erreur createPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL PRESENCES
=========================================================== */
module.exports.getAllPresence = async (_, res) => {
  try {
    const presences = await Presence.find()
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate("cours", "nom code credits semestre");

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getAllPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET PRESENCE BY ID
=========================================================== */
module.exports.getPresenceById = async (req, res) => {
  try {
    const presence = await Presence.findById(req.params.id)
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate("cours", "nom code credits semestre");

    if (!presence) return res.status(404).json({ message: "Présence introuvable." });
    res.status(200).json(presence);
  } catch (error) {
    console.error("❌ Erreur getPresenceById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET PRESENCES BY ETUDIANT
=========================================================== */
module.exports.getPresenceByEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const presences = await Presence.find({ etudiant: etudiantId })
      .populate("cours", "nom code credits semestre")
      .populate("enseignant", "prenom nom email");

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getPresenceByEtudiant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET PRESENCES BY ENSEIGNANT
=========================================================== */
module.exports.getPresenceByEnseignant = async (req, res) => {
  try {
    const { enseignantId } = req.params;
    const presences = await Presence.find({ enseignant: enseignantId })
      .populate("cours", "nom code credits semestre")
      .populate("etudiant", "prenom nom email");

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getPresenceByEnseignant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET PRESENCES BY COURS
=========================================================== */
module.exports.getPresenceByCours = async (req, res) => {
  try {
    const { coursId } = req.params;
    const presences = await Presence.find({ cours: coursId })
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate("cours", "nom code credits semestre");

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getPresenceByCours:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
/* ===========================================================
   📊 CALCUL DU TAUX DE PRÉSENCE
=========================================================== */
module.exports.getTauxPresence = async (req, res) => {
  try {
    const { etudiantId, coursId } = req.params;

    // Construire le filtre de recherche
    const filter = { etudiant: etudiantId };
    if (coursId) filter.cours = coursId;

    // Récupérer toutes les présences correspondantes
    const presences = await Presence.find(filter);

    if (presences.length === 0) {
      return res.status(404).json({ message: "Aucune donnée de présence trouvée pour cet étudiant." });
    }

    // Compter le nombre de présences et d’absences
    const total = presences.length;
    const presents = presences.filter(p => p.statut === "présent").length;

    // Calcul du taux (en %)
    const taux = ((presents / total) * 100).toFixed(2);

    res.status(200).json({
      etudiantId,
      coursId: coursId || "tous les cours",
      totalPresences: total,
      nombrePresent: presents,
      tauxPresence: `${taux}%`,
    });
  } catch (error) {
    console.error("❌ Erreur getTauxPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📚 2. TAUX DE PRÉSENCE DE TOUS LES ÉTUDIANTS D’UN COURS
=========================================================== */
module.exports.getTauxPresenceByCours = async (req, res) => {
  try {
    const { coursId } = req.params;

    // 1️⃣ Vérifier si le cours existe
    const cours = await Cours.findById(coursId)
      .populate("etudiants", "prenom nom email");
    if (!cours) {
      return res.status(404).json({ message: "Cours introuvable." });
    }

    // 2️⃣ Récupérer toutes les présences liées à ce cours
    const presences = await Presence.find({ cours: coursId })
      .populate("etudiant", "prenom nom email");

    if (!presences || presences.length === 0) {
      return res.status(404).json({ message: "Aucune donnée de présence pour ce cours." });
    }

    // 3️⃣ Calcul du taux pour chaque étudiant inscrit dans le cours
    const resultats = cours.etudiants.map((etudiant) => {
      const presEtudiant = presences.filter(
        (p) => p.etudiant && p.etudiant._id.toString() === etudiant._id.toString()
      );

      if (presEtudiant.length === 0) {
        return {
          etudiant: {
            _id: etudiant._id,
            prenom: etudiant.prenom,
            nom: etudiant.nom,
            email: etudiant.email,
          },
          tauxPresence: "0%",
          total: 0,
          presents: 0,
        };
      }

      const total = presEtudiant.length;
      const presents = presEtudiant.filter((p) => p.statut === "présent").length;
      const taux = ((presents / total) * 100).toFixed(2);

      return {
        etudiant: {
          _id: etudiant._id,
          prenom: etudiant.prenom,
          nom: etudiant.nom,
          email: etudiant.email,
        },
        tauxPresence: `${taux}%`,
        total,
        presents,
      };
    });

    // 4️⃣ Réponse finale
    res.status(200).json({
      coursId,
      coursNom: cours.nom,
      nombreEtudiants: resultats.length,
      tauxPresenceParEtudiant: resultats,
    });
  } catch (error) {
    console.error("❌ Erreur getTauxPresenceByCours:", error);
    res.status(500).json({
      message: "Erreur interne du serveur.",
      error: error.message,
    });
  }
};

/* ===========================================================
   ✏️ UPDATE PRESENCE
=========================================================== */
module.exports.updatePresence = async (req, res) => {
  try {
    const updatedPresence = await Presence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPresence) return res.status(404).json({ message: "Présence introuvable." });

    res.status(200).json({ message: "Présence mise à jour ✅", presence: updatedPresence });
  } catch (error) {
    console.error("❌ Erreur updatePresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE PRESENCE
=========================================================== */
module.exports.deletePresence = async (req, res) => {
  try {
    const deletedPresence = await Presence.findByIdAndDelete(req.params.id);
    if (!deletedPresence) return res.status(404).json({ message: "Présence introuvable." });

    await Promise.all([
      User.updateMany({}, { $pull: { presences: deletedPresence._id } }),
      Cours.updateMany({}, { $pull: { presences: deletedPresence._id } }),
    ]);

    res.status(200).json({ message: "Présence supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deletePresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ⚠️ DELETE ALL PRESENCES
=========================================================== */
module.exports.deleteAllPresence = async (req, res) => {
  try {
    const result = await Presence.deleteMany({});
    await Promise.all([
      User.updateMany({}, { $set: { presences: [] } }),
      Cours.updateMany({}, { $set: { presences: [] } }),
    ]);

    res.status(200).json({
      message: "Toutes les présences ont été supprimées ✅",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Erreur deleteAllPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
