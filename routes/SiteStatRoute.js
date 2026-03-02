const express = require('express');
const router = express.Router();
const SiteStat = require('../models/SiteStat');
const Boutique = require("../models/Boutique");
const Produit = require("../models/Produit");
const Salle = require("../models/Salle");
const auth= require('../middlewares/Auth');
const Charge= require('../models/Charge');


function getDateRange(month, year) {
  if (month === "all" || month === "") month = undefined;
  if (year === "all" || year === "") year = undefined;
  const currentYear = new Date().getFullYear();
  const selectedYear = year ? Number(year) : currentYear;

  if (month) {
    const startDate = new Date(selectedYear, Number(month) - 1, 1, 0, 0, 0);
    const endDate = new Date(selectedYear, Number(month), 0, 23, 59, 59);
    return { startDate, endDate };
  } else if (year) {
    const startDate = new Date(selectedYear, 0, 1, 0, 0, 0);
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
    return { startDate, endDate };
  } else {
    return null; // pas de filtre → tout
  }
}



router.post('/visit', async (req, res) => {
  try {
    let stat = await SiteStat.findOne();
    if (!stat) {
      stat = await SiteStat.create({ nombre_visite: 1 });
    } else {
      stat.nombre_visite += 1;
      await stat.save();
    }

    res.json({ nombre_visite: stat.nombre_visite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get('/visitors',auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};

    const range = getDateRange(month, year);
    if (range) query.createdAt = { $gte: range.startDate, $lte: range.endDate };
    let stat = await SiteStat.findOne(query);
    res.json({ nombre_visite: stat ? stat.nombre_visite : 0 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


router.get('/stores/count', auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};

    const range = getDateRange(month, year);
    if (range) query.createdAt = { $gte: range.startDate, $lte: range.endDate };

    const total = await Boutique.countDocuments(query);
    res.json({ total_boutiques: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


router.get('/products/count',auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};

    const range = getDateRange(month, year);
    if (range) query.createdAt = { $gte: range.startDate, $lte: range.endDate };

    const total = await Produit.countDocuments(query); // compte tous les documents Boutique
    res.json({ total_produits: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


router.get('/rooms/libres/count',auth(["admin"]), async (req, res) => {
  try {

    let query = { statut: "libre" };
    
    const totalLibres = await Salle.countDocuments(query);
    res.json({ salles_libres: totalLibres });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get('/centre/chiffre-affaire', auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query; 

    let match = { du_centre: true, statut: "paye" };

    const range = getDateRange(month, year);
    if(range)  match.createdAt = { $gte: range.startDate, $lte: range.endDate };

    const result = await Charge.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$valeur" } } }
    ]);

    const chiffreAffaire = result.length > 0 ? result[0].total : 0;
    res.json({ chiffre_affaire: chiffreAffaire });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get('/centre/chiffre-affaire/repartition', auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query;

    // Filtre de base
    let match = {
      du_centre: true,
      statut: "paye",
      reference: { $in: ["RENT001", "SPONSOR002"] }
    };

    const range = getDateRange(month, year);
    if(range)  match.createdAt = { $gte: range.startDate, $lte: range.endDate };

    const result = await Charge.aggregate([
      { $match: match },
      { $group: { _id: "$reference", total: { $sum: "$valeur" } } }
    ]);

    const repartition = { loyers: 0, sponsors: 0 };
    result.forEach(item => {
      if(item._id === "RENT001") repartition.loyers = item.total;
      if(item._id === "SPONSOR002") repartition.sponsors = item.total;
    });

    res.json(repartition);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


router.get('/centre/chiffre-affaire/evolution/mensuel', auth(["admin"]), async (req, res) => {
  try {
    const { year } = req.query;

    const selectedYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(selectedYear, 0, 1, 0, 0, 0); // 1er janvier
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59); // 31 décembre

    const result = await Charge.aggregate([
      { 
        $match: {
          du_centre: true,
          statut: "paye",
          reference: { $in: ["RENT001", "SPONSOR002"] },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { 
        $group: {
          _id: { month: { $month: "$createdAt" } },
          total: { $sum: "$valeur" }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // Transformer pour Angular : ["Jan", "Feb", ...]
    const data = result.map(item => {
      const date = new Date(selectedYear, item._id.month - 1);
      const month = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      return { month, total: item.total };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


router.get('/rooms/repartition', auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = {};
    const range = getDateRange(month, year);
    if (range) query.createdAt = { $gte: range.startDate, $lte: range.endDate };

    const libres = await Salle.countDocuments({ ...query, statut: "libre" });
    const occupes = await Salle.countDocuments({ ...query, statut: "occupee" });

    res.json({
      libres,
      occupes
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


router.get('/products/performance', auth(["admin"]), async (req, res) => {
  try {
    const { month, year } = req.query;

    let match = {};
    const range = getDateRange(month, year);
    if (range) match.createdAt = { $gte: range.startDate, $lte: range.endDate };

    const result = await Produit.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "boutiques",        
          localField: "boutique",
          foreignField: "_id",
          as: "boutique_info"
        }
      },
      { $unwind: "$boutique_info" }, 
      {
        $group: {
          _id: "$boutique_info.nom", 
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



module.exports = router;
