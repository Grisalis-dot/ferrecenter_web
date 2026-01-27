// backend/server.js
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const configRoutes = require('./routes/configRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const companyRoutes = require('./routes/companyRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();

// --- Middlewares ---
// Permite recibir datos en formato JSON
app.use(express.json());
// Permite solicitudes desde el frontend (CORS)
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // En producción, define FRONTEND_URL con tu dominio real
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// --- Conexión a Base de Datos (MongoDB) ---
// Nota: Si no tienes una variable definida, intentará conectar a local
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ferrecenter';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Base de datos MongoDB conectada exitosamente'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// --- Rutas de la API ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/company', companyRoutes);

// --- Hacer pública la carpeta uploads ---
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// --- Ruta de Prueba ---
app.get('/', (req, res) => {
  res.send('API de FerreCenter funcionando correctamente');
});

// --- Iniciar Servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
