const express = require("express");
const router = express.Router();
const Boutique = require("../models/Boutique");
const Salle = require("../models/Salle")
const auth = require("../middlewares/Auth");
const User = require("../models/User");
const Produit = require("../models/Produit");
const Centre = require("../models/Centre");
const Charge = require("../models/Charge");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const upload = require('../middlewares/multer-config');

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
router.get("/getBoutique/:id", async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate("user", "email")
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
router.put("/updateBoutique/:id", auth(["admin", "boutique"]), upload.single('logo'), async (req, res) => {
  try {
    console.log("FILES:", req.file);
    console.log("BODY:", req.body);

    const boutique = await Boutique.findById(req.params.id);
    if (!boutique) return res.status(404).json({ message: "Boutique not found" });

    if (req.user.role === "boutique" && boutique.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette boutique" });
    }

    const { nom, telephone, salle } = req.body;
    
    if (nom) boutique.nom = nom;
    if (telephone) boutique.telephone = telephone;
    if (req.body.horaires) {
      try {
        boutique.horaires = typeof req.body.horaires === 'string' 
          ? JSON.parse(req.body.horaires) 
          : req.body.horaires;
      } catch (e) {
        return res.status(400).json({ message: "Format horaires invalide" });
      }
    }
    if (req.file) {
      boutique.logo = `/uploads/${req.file.filename}`;
    }

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


router.get("/loyer/adminPay/:id", async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id).populate("salle");
    if (!boutique) return res.status(404).json({ message: "Boutique not found" });

    const centre = await Centre.findOne();
    if (!centre) return res.status(404).json({ message: "Centre not found" });

    const loyer = boutique.salle.tailleMetreCarre * centre.prixMetreCarre; 
    res.status(200).json({
      loyer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


//calcule loyer
router.get("/loyer/:id", async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id).populate("salle");
    if (!boutique) return res.status(404).json({ message: "Boutique not found" });

    const centre = await Centre.findOne();
    if (!centre) return res.status(404).json({ message: "Centre not found" });

    const loyer = boutique.salle.tailleMetreCarre * centre.prixMetreCarre;
    if (loyer > 999999.99) {
      return res.status(400).json({
        message: "The amount is too high, please pay it to the Admin"
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(loyer * 100), // sécurité pour éviter les décimales
      currency: "eur",
      description: `Loyer pour la boutique ${boutique.nom}`,
    });

    res.status(200).json({
      loyer,
      clientSecret: paymentIntent.client_secret,
      publishable_key: process.env.STRIPE_PUBLIC_KEY
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});




router.get('/loyernonpayees', async (req, res) => {
  try {
    const { mois, annee, statut } = req.query;  

    if (!mois || !annee) return res.status(400).json({ message: 'Mois et année requis' });

    const startDate = new Date(Number(annee), Number(mois) - 1, 1);
    const endDate = new Date(Number(annee), Number(mois), 0, 23, 59, 59);

    const chargesPayees = await Charge.find({
      statut,
      date_limite: { $gte: startDate, $lte: endDate },
      reference:'RENT001'
    }).distinct('boutique');

    const boutiques = await Boutique.find({
      _id: { $nin: chargesPayees }
    });

    res.json(boutiques);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});



router.get('/loyerpaye', async (req, res) => {
  const { mois, annee } = req.query;

  if (!mois || !annee) {
    return res.status(400).json({ message: 'Mois et année requis' });
  }

  try {
    const startDate = new Date(parseInt(annee), parseInt(mois) - 1, 1);
    const endDate = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);
    const chargesPayees = await Charge.find({ 
      reference: 'RENT001',
      statut: 'paye',
      date_limite: { $gte: startDate, $lte: endDate }
    }).populate('boutique'); // on récupère les infos de la boutique

    const events = chargesPayees.map(charge => ({
      title: charge.boutique?.nom || 'Boutique inconnue',
      start: charge.date_limite.toISOString().split('T')[0],
      color: '#16a34a', // vert pour payé
    }));

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;