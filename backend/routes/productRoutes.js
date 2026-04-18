const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Obtener todos los productos (Público)
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    // Hacemos un join con la tabla categories para obtener el nombre
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)');

    if (error) throw error;

    const formattedProducts = data.map(p => ({ 
      ...p, 
      _id: p.id, 
      imageUrl: p.image_url,
      category: p.categories?.name || 'Sin Categoría',
      isOffer: p.is_offer, // Mapeo para el frontend
      offerPrice: p.offer_price
    }));
    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// Crear producto (Solo Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { name, description, price, category, subcategory, stock, minStock, imageUrl, isOffer, offerPrice } = req.body;
    
    // Validamos que 'category' sea un ID numérico válido para Supabase
    const categoryId = parseInt(category);
    if (isNaN(categoryId)) throw new Error('La categoría seleccionada no es válida (debe ser un ID)');

    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        name, description, price, 
        category_id: categoryId,
        subcategory, stock, 
        min_stock: minStock, 
        image_url: imageUrl,
        is_offer: isOffer || false,
        offer_price: offerPrice || null
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, _id: data.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar producto (Solo Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { name, description, price, category, subcategory, stock, minStock, imageUrl, isOffer, offerPrice } = req.body;

    const categoryId = parseInt(category);

    const { data, error } = await supabase
      .from('products')
      .update({
        name, description, price,
        category_id: isNaN(categoryId) ? undefined : categoryId,
        subcategory,
        stock,
        min_stock: minStock,
        image_url: imageUrl,
        is_offer: isOffer,
        offer_price: offerPrice
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ ...data, _id: data.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar producto (Solo Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

module.exports = router;