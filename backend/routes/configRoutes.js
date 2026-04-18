const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Obtener configuración por clave (Público)
router.get('/:key', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { data, error } = await supabase.from('configs').select('value').eq('key', req.params.key).single();
    res.json(data ? data.value : null);
  } catch (error) {
    res.json(null);
  }
});

// Guardar configuración (Solo Admin)
router.post('/', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { key, value } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('configs')
      .upsert({ key, value })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar configuración' });
  }
});

module.exports = router;