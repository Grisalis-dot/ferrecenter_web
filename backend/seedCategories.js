const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    await Category.deleteMany(); // Limpiar existentes para no duplicar
    console.log('🗑️  Categorías anteriores eliminadas');

    await Category.insertMany(categories);
    console.log('🎉 Categorías importadas exitosamente');

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedCategories();