const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const categories = [
  {
    name: 'Herramientas',
    subcategories: ['Herramientas manuales', 'Herramientas eléctricas', 'Herramientas inalámbricas', 'Herramientas neumáticas', 'Juegos de herramientas', 'Cajas y organizadores de herramientas', 'Accesorios para herramientas (brocas, discos, lijas)']
  },
  {
    name: 'Tornillería y Fijaciones',
    subcategories: ['Tornillos', 'Tuercas', 'Arandelas', 'Chazos / tacos', 'Anclajes', 'Clavos', 'Grapas', 'Remaches']
  },
  {
    name: 'Construcción',
    subcategories: ['Cemento', 'Arena', 'Grava', 'Ladrillos y bloques', 'Yeso / estuco', 'Varillas y mallas', 'Pegantes y morteros', 'Aditivos para construcción']
  },
  {
    name: 'Electricidad',
    subcategories: ['Cables eléctricos', 'Interruptores y tomacorrientes', 'Breakers y tableros', 'Luminarias', 'Bombillos', 'Canaletas', 'Conectores eléctricos', 'Temporizadores y sensores']
  },
  {
    name: 'Plomería / Fontanería',
    subcategories: ['Tuberías (PVC, CPVC, cobre, galvanizado)', 'Conexiones y codos', 'Llaves de paso', 'Griferías', 'Sifones y desagües', 'Bombas de agua', 'Tanques', 'Selladores y teflones']
  },
  {
    name: 'Pinturas y Acabados',
    subcategories: ['Pinturas interiores', 'Pinturas exteriores', 'Esmaltes', 'Barnices', 'Impermeabilizantes', 'Brochas y rodillos', 'Pistolas de pintura', 'Selladores']
  },
  {
    name: 'Cerrajería',
    subcategories: ['Cerraduras', 'Candados', 'Bisagras', 'Manijas', 'Chapas', 'Cilindros', 'Accesorios para puertas']
  },
  {
    name: 'Seguridad Industrial',
    subcategories: ['Cascos', 'Guantes', 'Gafas de seguridad', 'Botas industriales', 'Mascarillas', 'Arnés de seguridad', 'Chalecos reflectivos']
  },
  {
    name: 'Jardinería',
    subcategories: ['Herramientas de jardín', 'Mangueras', 'Sistemas de riego', 'Fertilizantes', 'Semillas', 'Cortadoras de césped', 'Fumigadoras']
  },
  {
    name: 'Adhesivos, Selladores y Químicos',
    subcategories: ['Siliconas', 'Pegantes industriales', 'Colas', 'Selladores', 'Lubricantes', 'Desengrasantes', 'Limpiadores industriales']
  },
  {
    name: 'Metales y Perfiles',
    subcategories: ['Perfiles metálicos', 'Ángulos', 'Platinas', 'Tubos metálicos', 'Láminas', 'Alambres']
  },
  {
    name: 'Techos y Cubiertas',
    subcategories: ['Tejas', 'Policarbonato', 'Impermeabilización de techos', 'Canaletas', 'Accesorios para cubiertas']
  },
  {
    name: 'Hogar y Organización',
    subcategories: ['Estanterías', 'Organizadores', 'Escaleras', 'Ruedas y carretillas', 'Soportes']
  },
  {
    name: 'Iluminación',
    subcategories: ['Lámparas LED', 'Reflectores', 'Iluminación exterior', 'Iluminación industrial', 'Accesorios de iluminación']
  },
  {
    name: 'Automotriz',
    subcategories: ['Aceites', 'Baterías', 'Herramientas automotrices', 'Accesorios para vehículos']
  },
  {
    name: 'Ferretería General',
    subcategories: ['Cintas (aislante, masking, doble faz)', 'Cuerdas y sogas', 'Plásticos y lonas', 'Esponjas y abrasivos', 'Básicos varios']
  }
];

const seedCategories = async () => {
  try {
    console.log('🚀 Iniciando migración de categorías a Supabase...');

    // 1. Limpiar existentes (TRUNCATE requiere permisos, usamos delete sin filtro)
    const { error: deleteError } = await supabase.from('categories').delete().neq('id', 0);
    if (deleteError) throw deleteError;
    console.log('🗑️  Categorías anteriores eliminadas');

    // 2. Insertar las nuevas categorías
    const { error: insertError } = await supabase.from('categories').insert(categories);
    if (insertError) throw insertError;

    console.log('🎉 Categorías importadas exitosamente');

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedCategories();