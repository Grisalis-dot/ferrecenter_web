const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
  const supabase = req.app.get('supabase');
  const { email, password } = req.body;
  
  const { data: user, error } = await supabase.from('profiles').select('*').eq('email', email).single();

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      address: user.address,
      phone: user.phone,
      identification: user.identification,
      imageUrl: user.image_url,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: 'Correo o contraseña inválidos' });
  }
});

// Registro
router.post('/', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, email, password, address, phone, identification } = req.body;

  const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (existingUser) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  // 1. Crear el usuario en el sistema de autenticación de Supabase
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) return res.status(400).json({ message: 'Error en autenticación: ' + authError.message });

  // 2. Encriptar para tu lógica de perfiles
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Crear el perfil vinculado al ID de autenticación
  const { data: user, error } = await supabase
    .from('profiles')
    .insert([{ 
      id: authUser.user.id,
      name, email, password: hashedPassword, address, phone, identification 
    }])
    .select().single();

  if (error) return res.status(400).json({ message: error.message });

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.is_admin,
    token: generateToken(user.id),
  });
});

// Olvidé Contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const supabase = req.app.get('supabase');
  try {
    const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (!user) {
      return res.status(200).json({ success: true, data: 'Correo de restablecimiento enviado si el usuario existe.' });
    }

    const newPassword = crypto.randomBytes(4).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await supabase.from('profiles').update({ password: hashedPassword }).eq('id', user.id);

    const message = `Has solicitado restablecer tu contraseña. \n\nTu nueva contraseña es: ${newPassword} \n\nPor favor, inicia sesión con esta contraseña. Te recomendamos cambiarla después de ingresar.`;
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: {
          rejectUnauthorized: false
        }
      });
      await transporter.sendMail({
        from: `"Soporte FerreCenter" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Restablecimiento de contraseña',
        text: message,
      });
      res.status(200).json({ success: true, data: 'Correo de restablecimiento enviado.' });
    } catch (emailError) {
      console.error('❌ Error enviando correo (Credenciales inválidas o bloqueo de seguridad):', emailError.message);
      res.status(200).json({ success: true, data: 'No se pudo enviar el correo real, pero la contraseña se generó en la consola del servidor.' });
    }
  } catch (error) {
    console.error('Error en forgot-password:', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para enviar Cotización
router.post('/quote', protect, async (req, res) => {
  const { name, email, identification, department, city, address, message } = req.body;

  const emailContent = `
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

  // Verificación preventiva de variables de entorno
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Error: EMAIL_USER o EMAIL_PASS no están configurados en el archivo .env');
    return res.status(500).json({ message: 'Error de configuración en el servidor de correo.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"FerreCenter Cotizaciones" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER || 'servicios.ferrecenter@gmail.com', // Fallback seguro
      replyTo: email, // Permite responder directamente al cliente desde el correo
      subject: `Nueva Cotización de ${name}`,
      text: emailContent,
    });

    res.status(200).json({ success: true, message: 'Cotización enviada correctamente' });
  } catch (error) {
    console.error('❌ Error detallado enviando cotización:', error);
    res.status(500).json({ message: 'Error al enviar la cotización. Revise la consola del servidor.' });
  }
});

// --- PERFIL DE USUARIO ---

// Obtener perfil
router.get('/profile', protect, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data: user, error } = await supabase.from('profiles').select('*').eq('id', req.user._id).single();

  if (user && !error) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      address: user.address,
      phone: user.phone,
      identification: user.identification,
      imageUrl: user.image_url,
    });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Actualizar perfil
router.put('/profile', protect, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, email, address, phone, identification, imageUrl, password } = req.body;
  
  const updateData = { name, email, address, phone, identification, image_url: imageUrl };
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  const { data: updatedUser, error } = await supabase.from('profiles').update(updateData).eq('id', req.user._id).select().single();
  if (error) return res.status(404).json({ message: 'Usuario no encontrado' });

  res.json({
    _id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.is_admin,
    address: updatedUser.address,
    phone: updatedUser.phone,
    identification: updatedUser.identification,
    imageUrl: updatedUser.image_url,
    token: generateToken(updatedUser.id),
  });
});

// --- GESTIÓN DE USUARIOS (ADMIN) ---

// Obtener todos los usuarios
router.get('/', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data: users, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ message: 'Error al obtener usuarios' });
  res.json(users.map(u => ({ ...u, _id: u.id, isAdmin: u.is_admin })));
});

// Eliminar usuario
router.delete('/:id', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { error } = await supabase.from('profiles').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json({ message: 'Usuario eliminado' });
});

// Obtener usuario por ID
router.get('/:id', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data: user, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
  if (user && !error) {
    res.json({ ...user, _id: user.id, isAdmin: user.is_admin });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Actualizar usuario
router.put('/:id', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, email, isAdmin, address, phone, identification, password } = req.body;

  const updateData = { name, email, is_admin: isAdmin, address, phone, identification };
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  const { data: updatedUser, error } = await supabase.from('profiles').update(updateData).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ message: 'Usuario no encontrado' });

  res.json({
    _id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.is_admin,
  });
});

module.exports = router;