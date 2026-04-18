const express = require('express');
const router = express.Router();

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) throw error;
    // Agregamos _id para que el frontend no de error de llaves duplicadas o faltantes
    res.json(data.map(c => ({ ...c, _id: c.id })));
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

module.exports = router;