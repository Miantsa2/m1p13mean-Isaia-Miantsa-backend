const express = require("express");
const router = express.Router();
const Boutique = require("../models/Boutique");
const Salle = require("../models/Salle")
const auth = require("../middlewares/Auth");
const User = require("../models/User");
const Produit = require("../models/Produit");

// Lire toutes les boutiques
router.get("/getBoutiques", async (req, res) => {
  try {
    const boutiques = await Boutique.find()
      .populate("user")
      .populate("categorie")
      .populate({
        path: "salle",
        select: "reference tailleMetreCarre"
      });

    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lire une boutique spécifique par son ID
router.get("/getBoutique/:id", auth(["admin", "boutique"]), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate("user")
      .populate("categorie")
      .populate("salle");

    if (!boutique) return res.status(404).json({ message: "Boutique introuvable" });
    res.json(boutique);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Lire une boutique par sa connection
router.get("/getBoutiqueByUser", auth([]), async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ user: req.user.id })
      .populate("user")
      .populate("categorie")
      .populate("salle");

    if (!boutique) {
      return res.status(404).json({ message: "Boutique not found" });
    }

    res.json(boutique);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Créer une boutique
router.post("/createBoutique", auth(["admin"]), async (req, res) => {
  try {
    const boutique = new Boutique(req.body);
    await boutique.save();

    if (req.body.salle) {
      await Salle.findByIdAndUpdate(
        req.body.salle,
        { statut: "occupee" },
        { new: true }
      );
    }

    res.status(201).json(boutique);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Modifier une boutique
router.put("/updateBoutique/:id", auth(["admin", "boutique"]), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);
    if (!boutique) return res.status(404).json({ message: "Boutique not found" });

    // voir si c'est le boutique en question
    if (req.user.role === "boutique" && boutique.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette boutique" });
    }

    const { nom, telephone, horaires, salle } = req.body;
    
    if (nom) boutique.nom = nom;
    if (telephone) boutique.telephone = telephone;
    if (horaires) boutique.horaires = horaires;

    // Seul l'admin peut changer la salle
    if (req.user.role === "admin" && salle && salle !== boutique.salle?.toString()) {
      if (boutique.salle) await Salle.findByIdAndUpdate(boutique.salle, { statut: "libre" });
      await Salle.findByIdAndUpdate(salle, { statut: "occupee" });
      boutique.salle = salle;
    }

    await boutique.save();
    const updatedBoutique = await boutique.populate("user categorie salle");
    
    res.json(updatedBoutique);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update un logo pour une boutique
router.put("/updateLogoBoutique/:id", auth(["admin", "boutique"]), async (req, res) => {
  try {
      const updated = await Boutique.findByIdAndUpdate(
          req.params.id,
          { logo: req.body.logo },
          { new: true }
      );
      res.status(200).json(updated);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


// Supprimer une boutique 
router.delete("/deleteBoutique/:id", auth(["admin"]), async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);

    if (!boutique) {
      return res.status(404).json({ message: "Boutique not found" });
    }

    // Supprimer les produits associés
    await Produit.deleteMany({ boutique: req.params.id });

    // Libérer la salle
    const salleId =
      typeof boutique.salle === "object"
        ? boutique.salle._id
        : boutique.salle;

    if (salleId) {
      await Salle.findByIdAndUpdate(salleId, { statut: "libre" });
    }

    // Supprimer le user associé
    if(boutique.user) {
      await User.findByIdAndDelete(boutique.user);
    }

    // Supprimer la boutique à la fin
    await boutique.deleteOne();

    res.json({ message: "Boutique, user, products deleted successfully and room free again" });
  } catch (error) {
    console.error("DELETE BOUTIQUE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/updateNotif/:id", auth([]), async (req, res) => {
  try {
    const { description, titre } = req.body;

    if (!description) {
      return res.status(400).json({ message: "description is required" });
    }

    const notification = {
      description,
      titre: titre || 'Notification',
      envoyeur: req.user.id || null
      // date_envoyee est auto
    };

    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notifications: notification
        }
      },
      { new: true }
    );

    if (!boutique) {
      return res.status(404).json({ message: "cannot find store" });
    }

    res.status(200).json({
      message: "Notification added successfully",
      notifications: boutique.notifications
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.put('/readNotif/:id/notifications/lue', async (req, res) => {
    try {
        const result = await Boutique.updateOne(
            { _id: req.params.id },
            // $[].est_lu signifie : "Pour chaque élément du tableau, passe est_lu à true"
            { $set: { "notifications.$[].est_lue": true } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Aucune notification à mettre à jour" });
        }

        res.status(200).json({ message: "Notifications mises à jour !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;