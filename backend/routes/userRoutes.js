const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quote = require('../models/Quote');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { protect, admin } = require('../middleware/authMiddleware');

// Generar Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      address: user.address,
      phone: user.phone,
      identification: user.identification,
      imageUrl: user.imageUrl,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Correo o contraseña inválidos' });
  }
});

// Registro
router.post('/', async (req, res) => {
  const { name, email, password, address, phone, identification } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  const user = await User.create({ name, email, password, address, phone, identification });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    address: user.address,
    phone: user.phone,
    identification: user.identification,
    imageUrl: user.imageUrl,
    token: generateToken(user._id),
  });
});

// Olvidé Contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, data: 'Correo de restablecimiento enviado si el usuario existe.' });
    }
    const newPassword = crypto.randomBytes(4).toString('hex');
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const message = `Has solicitado restablecer tu contraseña. \n\nTu nueva contraseña es: ${newPassword} \n\nPor favor, inicia sesión con esta contraseña. Te recomendamos cambiarla después de ingresar.`;
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: `"Soporte FerreCenter" <servicios.ferrecenter@gmail.com>`,
        to: user.email,
        subject: 'Restablecimiento de contraseña',
        text: message,
      });
      res.status(200).json({ success: true, data: 'Correo de restablecimiento enviado.' });
    } catch (emailError) {
      console.error('❌ Error enviando correo (Credenciales inválidas o bloqueo de seguridad):', emailError.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️ FALLBACK (Solo Dev): Nueva contraseña generada:', newPassword);
      }
      res.status(200).json({ success: true, data: 'No se pudo enviar el correo real, pero la contraseña se generó en la consola del servidor.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Restablecer Contraseña
router.put('/reset-password/:token', async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({ success: true, data: 'Contraseña actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para enviar Cotización
router.post('/quote', async (req, res) => {
  const { name, email, identification, department, city, address, message } = req.body;
  try {
    await Quote.create({ name, email, identification, department, city, address, message });
  } catch (dbError) {
    console.error("Error guardando cotización en BD:", dbError);
  }
  const emailContent = `
    Nueva Solicitud de Cotización:
    
    Nombre: ${name}
    Identificación (CC/NIT): ${identification}
    Correo: ${email}
    
    Ubicación de Entrega:
    Departamento: ${department}
    Ciudad/Municipio: ${city}
    Dirección: ${address}
    
    Mensaje:
    ${message}
  `;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"Cotizaciones Web" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Nueva Cotización de ${name}`,
      text: emailContent,
    });
    res.status(200).json({ success: true, message: 'Cotización enviada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al enviar la cotización' });
  }
});

// Obtener todas las cotizaciones (Solo Admin)
router.get('/quotes', protect, admin, async (req, res) => {
  try {
    const quotes = await Quote.find({}).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cotizaciones' });
  }
});

// --- PERFIL DE USUARIO ---

// Obtener perfil
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      address: user.address,
      phone: user.phone,
      identification: user.identification,
      imageUrl: user.imageUrl,
    });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Actualizar perfil
router.put('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    user.phone = req.body.phone || user.phone;
    user.identification = req.body.identification || user.identification;
    if (req.body.imageUrl) user.imageUrl = req.body.imageUrl;
    if (req.body.password) user.password = req.body.password;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      address: updatedUser.address,
      phone: updatedUser.phone,
      identification: updatedUser.identification,
      imageUrl: updatedUser.imageUrl,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// --- GESTIÓN DE USUARIOS (ADMIN) ---

// Obtener todos los usuarios
router.get('/', protect, admin, async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// Eliminar usuario
router.delete('/:id', protect, admin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.deleteOne();
    res.json({ message: 'Usuario eliminado' });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Obtener usuario por ID
router.get('/:id', protect, admin, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Actualizar usuario
router.put('/:id', protect, admin, async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    user.address = req.body.address || user.address;
    user.phone = req.body.phone || user.phone;
    user.identification = req.body.identification || user.identification;
    if (req.body.password) {
      user.password = req.body.password;
      console.log(`🔒 Contraseña actualizada por Admin para el usuario: ${user.email}`);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      address: updatedUser.address,
      phone: updatedUser.phone,
      identification: updatedUser.identification,
    });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

module.exports = router;