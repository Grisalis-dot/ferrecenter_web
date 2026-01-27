const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

module.exports = router;