const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Obtener perfil de la empresa
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { data: profile, error } = await supabase.from('company_profile').select('*').single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 es "no rows found"
    
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil de empresa' });
  }
});

// Actualizar perfil (Solo Admin)
router.post('/', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, nit, address, phone, email, logoUrl } = req.body;

  try {
    const { data, error } = await supabase
      .from('company_profile')
      .upsert({ 
        id: 1, // Siempre usamos el mismo ID para el perfil único
        name, nit, address, phone, email, 
        logo_url: logoUrl 
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil de empresa' });
  }
});

module.exports = router;