const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Usamos la contraseña desde el .env o una por defecto muy segura si no existe
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Rcadmin123';

const resetAdmin = async () => {
  try {
    console.log('🚀 Iniciando reseteo de administrador en Supabase...');

    // 1. Buscar y eliminar el usuario existente en la autenticación de Supabase
    // Nota: Esto eliminará automáticamente el perfil por la restricción CASCADE
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === 'admin@ferrecenter.com');
    
    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
    }
    console.log('🗑️  Usuario admin anterior eliminado');

    // 2. Crear el usuario en el sistema de autenticación de Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@ferrecenter.com',
      password: ADMIN_PASSWORD,
      email_confirm: true
    });

    if (authError) throw authError;

    // 3. Encriptar la contraseña para tu lógica manual de login en la tabla profiles
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // 4. Crear el perfil vinculado al ID de autenticación recién creado
    const { error } = await supabase.from('profiles').insert([
      {
        id: authUser.user.id,
        name: 'Admin FerreCenter',
        email: 'admin@ferrecenter.com',
        password: hashedPassword,
        is_admin: true,
        address: 'Cra 4 # 40 - 51',
        phone: '3243383079',
        identification: '123456789'
      }
    ]);

    if (error) throw error;

    console.log('🎉 Usuario Administrador creado exitosamente');
    console.log('📧 Email: admin@ferrecenter.com');
    console.log('🔑 Pass:  (Configurada en .env o por defecto)');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();