const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// Obtener todos los productos (Público)
router.get('/', async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// Crear producto (Solo Admin)
router.post('/', protect, admin, async (req, res) => {
  const { name, description, price, category, subcategory, stock, imageUrl } = req.body;

  const product = new Product({
    name, description, price, category, subcategory, stock, imageUrl
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// Actualizar producto (Solo Admin)
router.put('/:id', protect, admin, async (req, res) => {
  const { name, description, price, category, subcategory, stock, imageUrl } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.subcategory = subcategory || product.subcategory;
    product.stock = stock || product.stock;
    product.imageUrl = imageUrl || product.imageUrl;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

// Eliminar producto (Solo Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

module.exports = router;