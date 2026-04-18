// backend/server.js
const path = require('path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
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
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'https://ferrecenter-web.vercel.app', // Tu URL de Vercel
      /\.vercel\.app$/ // Permite cualquier subdominio de vercel para pruebas
    ];
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// --- Conexión a Supabase ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usamos Service Role para operaciones admin
);

app.set('supabase', supabase);
console.log('✅ Conexión con Supabase configurada');

// --- Rutas de la API ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/company', companyRoutes);

// --- Manejo de archivos estáticos (Deshabilitado en Vercel Serverless) ---
// Nota: Deberás migrar a Supabase Storage para las imágenes
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Ruta de Prueba ---
app.get('/', (req, res) => {
  res.send('API de FerreCenter funcionando correctamente');
});

// --- Iniciar Servidor ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor local en puerto ${PORT}`);
  });
}

module.exports = app;
