const express = require("express");
const router = express.Router();
const Panier = require("../models/Panier");

// Ventes Annuelles filtrées par année 
router.get("/ventes-annuelles/:boutiqueId", async (req, res) => {
    try {
        const { boutiqueId } = req.params;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        // Définir le début et la fin de l'année choisie
        const debutAnnee = new Date(year, 0, 1);
        const finAnnee = new Date(year, 11, 31, 23, 59, 59);

        // On filtre directement dans la base de données par date
        const paniers = await Panier.find({ 
            statut: "valide",
            createdAt: { $gte: debutAnnee, $lte: finAnnee } 
        }).populate("produits.id");

        const statsParMois = Array.from({ length: 12 }, (_, i) => ({
            mois: i + 1,
            nombreVentes: 0,
            montantTotal: 0
        }));

        paniers.forEach(panier => {
            const produitsMaBoutique = panier.produits.filter(p => 
                p.id && p.id.boutique && p.id.boutique.toString() === boutiqueId
            );

            if (produitsMaBoutique.length > 0) {
                const moisIndex = new Date(panier.createdAt).getMonth(); 
                statsParMois[moisIndex].nombreVentes += 1;
                const totalPanierPourMaBoutique = produitsMaBoutique.reduce((acc, p) => acc + p.sous_total, 0);
                statsParMois[moisIndex].montantTotal += totalPanierPourMaBoutique;
            }
        });

        res.status(200).json(statsParMois);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors du calcul des stats" });
    }
});

// Top Produits filtrés par année et mois 
router.get("/top-produits/:boutiqueId", async (req, res) => {
    try {
        const { boutiqueId } = req.params;
        const { mois, year } = req.query;
        const targetYear = parseInt(year) || new Date().getFullYear();

        // Filtre de base : l'année choisie
        const query = {
            statut: "valide",
            createdAt: { 
                $gte: new Date(targetYear, 0, 1), 
                $lte: new Date(targetYear, 11, 31, 23, 59, 59) 
            }
        };

        const paniers = await Panier.find(query).populate("produits.id");
        const ventesProduits = {};

        paniers.forEach(panier => {
            const datePanier = new Date(panier.createdAt);
            // On vérifie si le mois correspond (si un mois est fourni)
            const matchMois = mois ? (datePanier.getMonth() + 1) === parseInt(mois) : true;

            if (matchMois) {
                const mesProduits = panier.produits.filter(p => 
                    p.id && p.id.boutique && p.id.boutique.toString() === boutiqueId
                );

                mesProduits.forEach(p => {
                    const idProduit = p.id._id.toString();
                    if (!ventesProduits[idProduit]) {
                        ventesProduits[idProduit] = { nom: p.id.nom, totalVendu: 0 };
                    }
                    ventesProduits[idProduit].totalVendu += p.quantite;
                });
            }
        });

        const top3 = Object.values(ventesProduits)
            .sort((a, b) => b.totalVendu - a.totalVendu)
            .slice(0, 3); 

        res.status(200).json(top3);
    } catch (err) {
        res.status(500).json({ message: "Erreur calcul top produits" });
    }
});

// Dépense Moyenne Clients filtrée par année 
router.get("/depense-moyenne-clients/:boutiqueId", async (req, res) => {
    try {
        const { boutiqueId } = req.params;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const paniers = await Panier.find({ 
            statut: "valide",
            createdAt: { 
                $gte: new Date(year, 0, 1), 
                $lte: new Date(year, 11, 31, 23, 59, 59) 
            }
        }).populate("produits.id").populate("client"); 

        const statsClients = {};

        paniers.forEach(panier => {
            if (!panier.client) return;
            const mesProduits = panier.produits.filter(p => 
                p.id && p.id.boutique && p.id.boutique.toString() === boutiqueId
            );

            if (mesProduits.length > 0) {
                const clientId = panier.client._id.toString();
                const montantPanier = mesProduits.reduce((acc, p) => acc + p.sous_total, 0);

                if (!statsClients[clientId]) {
                    statsClients[clientId] = {
                        nom: panier.client.nom || "Client Anonyme",
                        totalDepenseTotal: 0,
                        nombreDeCommandes: 0
                    };
                }
                statsClients[clientId].totalDepenseTotal += montantPanier;
                statsClients[clientId].nombreDeCommandes += 1;
            }
        });

        const resultat = Object.values(statsClients).map(c => ({
            nom: c.nom,
            totalGlobal: c.totalDepenseTotal,
            nombreAchats: c.nombreDeCommandes,
            moyenneParCommande: Math.round(c.totalDepenseTotal / c.nombreDeCommandes)
        }));

        resultat.sort((a, b) => b.moyenneParCommande - a.moyenneParCommande);
        res.status(200).json(resultat);
    } catch (err) {
        res.status(500).json({ message: "Erreur calcul dépense moyenne" });
    }
});
module.exports = router;