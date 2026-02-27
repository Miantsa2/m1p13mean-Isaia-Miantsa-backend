const express = require("express");
const router = express.Router();
const Evenement = require("../models/Evenement");
const { sendEventAcceptedMail } = require("../controllers/MailController");
const User = require("../models/User");

// router.put("/acceptEvent/:id", async (req, res) => {
//   try {
//     const event = await Evenement.findById(req.params.id)
//       .populate({
//         path: "boutique",           
//         populate: { path: "user" }  
//       });
//       console.log(event);

//     event.statut = "approuved";

//     if (!event.email_envoye ) {
//       console.log(`Envoi de l'email pour l'événement ${event.boutique.user.email}`);
//       sendEventAcceptedMail(event.boutique, event);
//       event.email_envoye = true;
//       await event.save();
//     }

//     res.status(200).json({
//       message: "Événement accepté et email envoyé",
//       event
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Erreur lors de l'acceptation de l'événement",
//       error: err.message
//     });
//   }
// });

router.put("/acceptEvent/:id", async (req, res) => {
  try {
    const event = await Evenement.findById(req.params.id)
      .populate({
        path: "boutique",
        populate: { path: "user" }
      });

    if (!event) {
      return res.status(404).json({ message: "Event introuvable" });
    }

    event.statut = "approved"; 
    await event.save();

    res.status(200).json({
      message: "Événement accepté",
      event
    });

    if (!event.email_envoye) {
      sendEventAcceptedMail(event.boutique, event)
        .then(async () => {
          event.email_envoye = true;
          await event.save();
        })
        .catch(err => {
          console.error("Erreur envoi mail:", err);
        });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur",
      error: err.message
    });
  }
});

router.post("/createEvent", async (req, res) => {
    try {
        const { dateDebut, dateFin } = req.body;
        
        if (new Date(dateDebut) >= new Date(dateFin)) {
            return res.status(400).json({ message: "La date de fin doit être postérieure à la date de début." });
        }
        const nouvelEvenement = new Evenement(req.body);
        const saveEv = await nouvelEvenement.save();
        res.status(201).json(saveEv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/getAllEvent", async (req, res) => {
    try {
        const evs = await Evenement.find()
            .populate("boutique")
            .sort({ dateDebut: -1 }); 
        res.status(200).json(evs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/getEventById/:id", async (req, res) => {
    try {
        const ev = await Evenement.findById(req.params.id)
            .populate("boutique");
        if (!ev) return res.status(404).json({ message: "Événement introuvable." });
        res.status(200).json(ev);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get("/getEventByBoutiqueId/:boutiqueId", async (req, res) => {
  try {
    const events = await Evenement.find({
      boutique: req.params.boutiqueId
    }).populate("boutique");

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/getEventByStatut/:statut", async (req, res) => {
  try {
    const events = await Evenement.find({
      statut: req.params.statut
    }).populate("boutique")
    .sort({ boutique: 1 });;

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.put("/updateEvent/:id", async (req, res) => {
    try {
        const updatedEv = await Evenement.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true } 
        );
        res.status(200).json(updatedEv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete("/deleteEvent/:id", async (req, res) => {
    try {
        const deletedEv = await Evenement.findByIdAndDelete(req.params.id);
        if (!deletedEv) return res.status(404).json({ message: "Événement introuvable." });
        res.status(200).json({ message: "Événement supprimé avec succès." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/getEvent", async (req, res) => {
    try {
        const maintenant = new Date();

        // Mise à jour auto des événements terminés
        await Evenement.updateMany(
            {
                dateFin: { $lt: maintenant },
                statut: { $nin: ["finished", "refused"] }
            },
            { $set: { statut: "finished" } }
        );

        const { type } = req.query;
        let query = {};

        if (type === "boutique") {
            // événements AVEC boutique
            query = {
                boutique: { $exists: true, $ne: null }
            };
        } else {
            // événements SANS boutique
            query = {
                $or: [
                    { boutique: null },
                    { boutique: { $exists: false } }
                ]
            };
        }

        const evs = await Evenement.find(query)
            .populate("boutique")
            .sort({ dateDebut: -1 });

        res.status(200).json(evs);
    } catch (err) {
        res.status(500).json({
            message: "Erreur lors de la récupération des événements",
            error: err.message
        });
    }
});

router.get("/SortEvent", async (req, res) => {
    try {
        const { order } = req.query; 
        const sortOrder = order === "asc" ? 1 : -1;
        const query = {}; 

        const evs = await Evenement.find(query) 
            .populate("boutique")
            .sort({ dateDebut: sortOrder });

        res.status(200).json(evs);
    } catch (err) {
        res.status(500).json({ 
            message: "Erreur lors de la récupération", 
            error: err.message 
        });
    }
});



router.get("/FilterEventCenter", async (req, res) => {
    try {

        let query = { 
            $or: [
                { boutique: null }, 
                { boutique: { $exists: false } }
            ] 
        };

        const {statut, order } = req.query;
        
        if (statut) query.statut = statut;
        const sortOrder = order === "asc" ? 1 : -1;
        const evs = await Evenement.find(query)
            .sort({ dateDebut: sortOrder });

        res.status(200).json(evs);
    } catch (err) {
        res.status(500).json({ 
            message: "Erreur lors de la récupération", 
            error: err.message 
        });
    }
});


router.get("/FilterEventStore", async (req, res) => {
    try {

         query = {
                boutique: { $exists: true, $ne: null }
        };

        const { boutiqueId, statut, order } = req.query;

        if (boutiqueId) query.boutique = boutiqueId;
        
        if (statut) query.statut = statut;
        const sortOrder = order === "asc" ? 1 : -1;
        const evs = await Evenement.find(query)
            .populate("boutique")
            .sort({ dateDebut: sortOrder });

        res.status(200).json(evs);
    } catch (err) {
        res.status(500).json({ 
            message: "Erreur lors de la récupération", 
            error: err.message 
        });
    }
});

router.get("/getEventByBoutiqueIdandStatut/:boutiqueId", async (req, res) => {
  try {
    const { boutiqueId } = req.params;
    const { statut } = req.query;

    const filter = { boutique: boutiqueId };

    if (statut) {
      filter.statut = statut;
    }

    const events = await Evenement.find(filter).populate("boutique");

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




module.exports = router;
