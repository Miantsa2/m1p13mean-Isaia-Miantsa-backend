const express = require('express');
const router = express.Router();
const SiteStat = require('../models/SiteStat');

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

router.get('/visitors', async (req, res) => {
  try {
    let stat = await SiteStat.findOne();
    res.json({ nombre_visite: stat ? stat.nombre_visite : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
