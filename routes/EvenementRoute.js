const express = require("express");
const router = express.Router();
const Evenement = require("../models/Evenement");



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
            .populate("centre") 
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
            .populate("centre")
            .populate("boutique");
        if (!ev) return res.status(404).json({ message: "Événement introuvable." });
        res.status(200).json(ev);
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
        await Evenement.updateMany(
            { 
                dateFin: { $lt: maintenant }, 
                statut: { $nin: ["termine", "refuse"] } 
            },
            { $set: { statut: "termine" } }
        );
        let query = {};
        const { type } = req.query; 

        if (type === 'boutique') {
            query = { 
                $or: [
                    { centre: null }, 
                    { centre: { $exists: false } }
                ] 
            };
        } else if (type === 'centre') {
            query = { 
                $or: [
                    { boutique: null }, 
                    { boutique: { $exists: false } }
                ] 
            };
        }
        const evs = await Evenement.find(query)
            .populate("boutique")
            .populate("centre") 
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
            .populate("centre")
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
            .populate("centre")
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

        let query = { 
            $or: [
                { centre: null }, 
                { centre: { $exists: false } }
            ] 
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


module.exports = router;
