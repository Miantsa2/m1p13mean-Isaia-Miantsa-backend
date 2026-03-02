const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middlewares/Auth');
const Stock = require('../models/Stock');
const Produit = require ('../models/Produit');

// Lire les stocks par boutique
router.get("/getInventory/:boutiqueId", auth(["boutique"]), async (req, res) => {
    try {
        const boutiqueId = new mongoose.Types.ObjectId(req.params.boutiqueId);
        const produits = await Produit.find({ boutique: boutiqueId }).populate("categorie");
        const inventory = await Promise.all(produits.map(async (p) => {
            const baseInfo = {
                _id: p._id,
                nom: p.nom,
                categorie: p.categorie,
            };
            // Pour les produits not storable
            if(p.stock === null || p.stock === undefined) {
                return {
                    ...baseInfo,
                    aboutStock: 'Not storable',
                    quantity: '-',
                    in: '-',
                    out: '-',
                    status: p.isAvailable ? 'Available' : 'Out of stock'
                }
            }

            // Pour les produits Storable
            const mouvements = await Stock.find({ produit: p._id});
            const stockInitial = Number(p.stock) || 0;

            const totalIn = mouvements
                .filter(m => m.est_entree === 1)
                .reduce((acc, curr) => acc + curr.quantite, 0);

            const totalOut = mouvements
                .filter(m => m.est_entree === 0)
                .reduce((acc, curr) => acc + curr.quantite, 0);

            const currentQTy = stockInitial + totalIn - totalOut;

            // status
            let status = 'Available';
            if (currentQTy <= 0) status = 'Out of stock';
            else if (currentQTy < 5) status = 'Low stock';
            
            return {
                ...baseInfo,
                aboutStock: 'Storable',
                quantity: currentQTy,
                in: totalIn,
                out: totalOut,
                status: status
            };
        }));

        res.json(inventory);
    }catch(error) {
        console.error("Erreur Backend Stock:", error);
        res.status(500).json({ message: error.message });
    }
});

// ajouter un stock pour un produit
router.post("/addMovement", auth(["boutique"]), async (req, res) => {
    try {
        const { produitId, quantite, est_entree } = req.body;

        if (!produitId || quantite === undefined) {
            return res.status(400).json({ message: "Insufficient data" });
        }

        const nouveauMouvement = new Stock({
            produit: produitId,
            est_entree: est_entree, // 1 pour entrée, 0 pour sortie
            quantite: Number(quantite)
        });

        await nouveauMouvement.save();
        res.status(201).json({ message: "Saved movement" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;