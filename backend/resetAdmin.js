const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const resetAdmin = async () => {
  try {
    // 1. Conectar a la BD
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // 2. Eliminar el usuario admin si existe
    await User.deleteOne({ email: 'admin@ferrecenter.com' });
    console.log('🗑️  Usuario admin anterior eliminado');

    // 3. Crear el usuario nuevo
    await User.create({
      name: 'Admin FerreCenter',
      email: 'admin@ferrecenter.com',
      password: 'admin123',
      isAdmin: true,
      address: 'Cra 4 # 40 - 51',
      phone: '3243383079',
      identification: '123456789'
    });

    console.log('🎉 Usuario Administrador creado exitosamente');
    console.log('📧 Email: admin@ferrecenter.com');
    console.log('🔑 Pass:  admin123');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();