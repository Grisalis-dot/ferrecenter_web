const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const { protect, admin } = require('../middleware/authMiddleware');

// Obtener configuración por clave (Público)
router.get('/:key', async (req, res) => {
  const config = await Config.findOne({ key: req.params.key });
  res.json(config ? config.value : null);
});

// Guardar configuración (Solo Admin)
router.post('/', protect, admin, async (req, res) => {
  const { key, value } = req.body;
  const config = await Config.findOneAndUpdate({ key }, { value }, { new: true, upsert: true });
  res.json(config);
});

module.exports = router;