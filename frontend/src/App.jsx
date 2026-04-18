import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, User, LogOut, PackagePlus, Search, Trash2, CreditCard, ArrowRight, Star, Image as ImageIcon, Eye, EyeOff, Menu, MapPin, Mail, Instagram, Camera, Filter, Edit, X, FileText, ShoppingBag, Package, Settings, Users, Clock, CheckCircle } from 'lucide-react';
import CartPage from './components/CartPage';

// Configuración de conexión con el Backend
// Detecta automáticamente si hay una variable de entorno (Prod) o usa localhost (Dev)
const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API = axios.create({ baseURL: `${SERVER_URL}/api` });

// Helper para manejar URLs de imágenes (Supabase vs Local)
const getImageUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER_URL}${url}`;
};

// --- COMPONENTES ---

// Barra de Navegación
const Navbar = ({ user, cartCount, logout, searchTerm, setSearchTerm, cartIconRef }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 font-sans shadow-md">
      {/* Barra superior de avisos */}
      <div className="bg-ferreRed text-white py-1 text-xs text-center font-medium tracking-wide">
        ¡ENVÍOS GRATIS EN PEDIDOS SUPERIORES A $100.000 EN BARRANQUILLA! 🚚
      </div>
      
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        {/* Botón de Menú para móvil */}
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-ferreRed">
          <Menu size={28} />
        </button>

        {/* Logo */}
        <Link to="/" className="text-3xl font-black tracking-tighter text-gray-800 flex items-center gap-2 group">
          <img src="/LoFerTrasn.png" alt="FerreCenter" className="h-12 md:h-20 object-contain" translate="no" />
        </Link>

        {/* Menú Usuario */}
        <div className="flex items-center gap-4">
          {/* Buscador (Visual) */}
          <div className="hidden md:flex items-center bg-ferreLight rounded-full px-4 py-2 w-full max-w-xs border border-transparent focus-within:border-ferreRed focus-within:bg-white transition-all duration-300">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {user?.isAdmin && (
            <Link to="/admin" className="flex items-center gap-2 hover:text-ferreRed transition-colors">
              <PackagePlus size={20} /> Admin
            </Link>
          )}
          
          <Link to="/cart" ref={cartIconRef} className="flex items-center gap-2 hover:text-ferreRed transition-colors relative group">
            <div className="relative">
              <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-ferreRed text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white">
                  {cartCount}
                </span>
            )}
            </div>
            <span className="hidden lg:block">Carrito</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="hidden md:flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex flex-col items-end leading-tight">
                <span className="text-xs text-gray-400">Bienvenido</span>
                <span className="text-sm font-bold text-gray-800">{user.name}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                  {user.imageUrl ? <img src={getImageUrl(user.imageUrl)} alt="Perfil" className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                </div>
              </Link>
              <button onClick={logout} className="flex items-center gap-1 text-sm bg-ferreLight hover:bg-red-100 hover:text-ferreRed px-3 py-2 rounded-lg transition-colors">
                <LogOut size={16} /> Salir
              </button>
            </div>
          ) : (
            <button onClick={() => setIsSidebarOpen(true)} className="hidden lg:flex items-center gap-2 bg-ferreDark text-white px-5 py-2.5 rounded-full hover:bg-ferreRed transition-all shadow-md hover:shadow-lg">
              <User size={18} /> <span>Cuenta</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de navegación secundaria */}
      <div className="border-t border-gray-200 bg-white hidden lg:block">
        <div className="container mx-auto px-6 py-3 flex justify-center items-center gap-10 font-semibold text-sm text-gray-700">
          <Link to="/" className="hover:text-ferreRed transition-colors">Home</Link>
          <Link to="/nosotros" className="hover:text-ferreRed transition-colors">Nosotros</Link>
          <Link to="/catalogo" className="hover:text-ferreRed transition-colors">Catálogo</Link>
          {user && <Link to="/cotizar" className="hover:text-ferreRed transition-colors">Cotizar</Link>}
          <Link to="/ofertas" className="hover:text-ferreRed transition-colors">Ofertas</Link>
          <Link to="/contacto" className="hover:text-ferreRed transition-colors">Contacto</Link>
        </div>
      </div>


      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-64 bg-white shadow-lg z-50 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-ferreDark">Mi Cuenta</h3>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-ferreRed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-6 space-y-4">
          {/* Buscador Móvil */}
          <div className="md:hidden mb-4">
            <div className="flex items-center bg-ferreLight rounded-full px-4 py-2 w-full border border-transparent focus-within:border-ferreRed focus-within:bg-white transition-all duration-300">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Home</Link>
          <Link to="/nosotros" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Nosotros</Link>
          <Link to="/catalogo" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Catálogo</Link>
          {user && <Link to="/cotizar" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Cotizar</Link>}
          <Link to="/ofertas" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Ofertas</Link>
          <Link to="/contacto" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Contacto</Link>
          {user && <Link to="/profile" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Mi Perfil</Link>}
          <div className="border-t border-gray-200 my-4"></div>
          <Link to="/login" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Iniciar sesión</Link>
          <Link to="/register" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Crear cuenta</Link>
          <Link to="/help" onClick={() => setIsSidebarOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-ferreRed transition-colors">Ayuda</Link>
        </nav>
      </div>

      {/* Overlay para cuando la barra lateral está abierta */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </nav>
  );
};

// Hero Section (Banner Principal)
const Hero = () => (
  <div className="relative bg-ferreDark text-white py-16 md:py-24 px-4 md:px-6 mb-12 overflow-hidden shadow-2xl">
    <div className="absolute inset-0 bg-gradient-to-r from-black via-ferreDark to-ferreRed z-10 opacity-90"></div>
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0"></div>
    
    <div className="container mx-auto relative z-20 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2">
        <span className="bg-ferreRed text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-4 inline-block">Calidad Profesional</span>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
          Construye tus <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-ferreRed to-orange-500">Sueños</span> con Nosotros
        </h1>
        <p className="text-lg text-gray-300 mb-8 max-w-lg drop-shadow-md">
          Encuentra las mejores herramientas y materiales de construcción con la garantía y soporte que solo FerreCenter te ofrece.
        </p>
        <Link to="/catalogo" className="inline-flex items-center gap-2 bg-gradient-to-r from-ferreRed to-[#991116] hover:from-[#991116] hover:to-ferreRed text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-red-900/50 transition-all transform hover:-translate-y-1 hover:shadow-xl">
          Ver Catálogo <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  </div>
);

// Categorías
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error("Error cargando categorías:", err));
  }, []);

  const getIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('herramientas')) return '🔧';
    if (n.includes('construcción')) return '🧱';
    if (n.includes('pinturas')) return '🎨';
    if (n.includes('electricidad')) return '⚡';
    if (n.includes('plomería')) return '🚰';
    if (n.includes('hogar')) return '🏠';
    if (n.includes('jardinería')) return '🌻';
    if (n.includes('seguridad')) return '👷';
    if (n.includes('automotriz')) return '🚗';
    if (n.includes('iluminación')) return '💡';
    if (n.includes('tornillería')) return '🔩';
    if (n.includes('cerrajería')) return '🔑';
    if (n.includes('adhesivos')) return '🧪';
    if (n.includes('metales')) return '🏗️';
    if (n.includes('techos')) return '🏠';
    return '📦';
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <h2 className="text-2xl font-bold text-ferreDark mb-6">Nuestras Categorías</h2>
      {categories.length === 0 ? (
        <div className="text-center py-10"><p className="text-gray-400">Cargando categorías...</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div key={cat._id || cat.id} onClick={() => navigate(`/catalogo?category=${encodeURIComponent(cat.name)}`)} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-100 text-center cursor-pointer transition-all hover:-translate-y-1 group hover:border-ferreRed/30 h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{getIcon(cat.name)}</div>
              <h3 className="font-bold text-ferreDark text-sm group-hover:text-ferreRed transition-colors">{cat.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Tarjeta de Producto
const ProductCard = ({ product, addToCart }) => {
  const hasOffer = product.isOffer && product.offerPrice;
  const currentPrice = hasOffer ? product.offerPrice : product.price;

  return (
  <div className="group bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden relative hover:-translate-y-1">
    <div className="relative h-48 md:h-64 bg-gray-50 flex items-center justify-center overflow-hidden p-6">
      <img 
        src={getImageUrl(product.imageUrl || product.image_url)} 
        alt={product.name} 
        className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none" 
        onContextMenu={(e) => e.preventDefault()}
        draggable="false"
        onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Sin+Imagen'} 
      />
      <div className="absolute top-4 left-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm border ${
            product.stock > 10 ? 'bg-green-100 text-green-700 border-green-200' :
            product.stock > 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
            'bg-red-100 text-red-700 border-red-200'
        }`}>
          {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
        </span>
      </div>
      <div className="absolute top-4 right-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm border ${hasOffer ? 'bg-orange-500 text-white border-orange-600 animate-pulse' : 'bg-white/90 backdrop-blur text-gray-600 border-gray-100'}`}>
          {hasOffer ? 'OFERTA' : product.category}
        </span>
      </div>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <h3 className="text-lg font-bold text-ferreDark mb-2 group-hover:text-ferreRed transition-colors">{product.name}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{product.description}</p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase font-semibold">Precio</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-ferreRed">${currentPrice.toLocaleString('es-CO')}</span>
            {hasOffer && (
              <span className="text-sm text-gray-400 line-through decoration-red-500/50">${product.price.toLocaleString('es-CO')}</span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => addToCart(product, e)} disabled={product.stock <= 0}
          className="bg-gradient-to-r from-ferreDark to-[#1a1a1a] hover:from-ferreRed hover:to-[#991116] text-white p-3 rounded-xl shadow-lg hover:shadow-red-500/40 transition-all duration-300 transform active:scale-95 flex items-center gap-2">
          <ShoppingCart size={18} /> <span className="text-sm font-bold">Comprar</span>
        </button>
      </div>
    </div>
  </div>
  );
};

// --- PÁGINAS ---

const Home = ({ addToCart, searchTerm }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error cargando productos:", err));
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-ferreLight min-h-screen pb-20">
      <Hero />
      <Categories />
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-ferreDark">Catálogo Destacado</h2>
            <p className="text-gray-500 mt-2">Explora nuestra selección de productos premium.</p>
          </div>
          <Link to="/catalogo" className="text-ferreRed font-bold hover:underline hidden md:block">Ver todo el inventario</Link>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-400 text-lg">Cargando productos o inventario vacío...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-400 text-lg">No se encontraron productos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(p => <ProductCard key={p._id} product={p} addToCart={addToCart} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// --- NUEVAS PÁGINAS DE MÓDULOS ---

const Nosotros = () => (
  <div className="bg-white py-12 md:py-20 px-4 md:px-6">
    <div className="container mx-auto max-w-4xl text-center">
      <h1 className="text-5xl font-black text-ferreDark mb-6">Nuestra Historia</h1>
      <p className="text-lg text-gray-600 leading-relaxed mb-8">
        Desde 2024, FerreCenter se ha consolidado como el aliado número uno para constructores, profesionales y entusiastas del bricolaje. Nacimos con la misión de proveer no solo productos de la más alta calidad, sino también el conocimiento y el soporte para que cada proyecto sea un éxito.
      </p>
      <p className="text-lg text-gray-600 leading-relaxed">
        Creemos en el poder de construir, de transformar ideas en realidades. Por eso, nuestro equipo está conformado por expertos apasionados que están listos para asesorarte en cada paso. En FerreCenter, más que una ferretería, somos tu socio de confianza.
      </p>
    </div>
  </div>
);

const Catalogo = ({ addToCart, searchTerm }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          API.get('/products'),
          API.get('/categories')
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location.search]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-ferreLight min-h-screen py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="text-left">
            <h1 className="text-5xl font-black text-ferreDark mb-4">Nuestro Catálogo</h1>
            <p className="text-lg text-gray-600">Explora todos nuestros productos disponibles.</p>
          </div>
          
          {/* Filtro de Categorías */}
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Filter size={16} /> Filtrar por Categoría
            </label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none bg-white shadow-sm cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-400 text-lg">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-400 text-lg">No se encontraron productos con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(p => <ProductCard key={p._id} product={p} addToCart={addToCart} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const Cotizar = ({ user }) => {
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', identification: '', department: '', city: '', address: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post('/users/quote', formData, config);
      setSent(true);
    } catch (error) {
      alert('Error al enviar la cotización. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ferreLight py-12 md:py-20 px-4 md:px-6">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-ferreDark mb-4">Solicita una Cotización</h1>
          <p className="text-lg text-gray-600">¿Compras al por mayor o necesitas algo específico? Rellena el formulario y te responderemos en menos de 24 horas.</p>
        </div>
        <div className="bg-white p-6 md:p-10 rounded-xl shadow-xl">
          {sent ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">¡Solicitud Enviada!</h2>
              <p className="text-gray-700">Gracias por contactarnos. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo a la brevedad.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula o NIT</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed" value={formData.identification} onChange={e => setFormData({...formData, identification: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required autoComplete="email" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                  <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Municipio</label>
                  <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Entrega</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed h-32" placeholder="Detalla los productos y cantidades que necesitas..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ferreRed to-[#991116] text-white py-3.5 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar Cotización'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const Ofertas = ({ addToCart }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get('/products')
      .then(res => setProducts(res.data.filter(p => p.isOffer)))
      .catch(err => console.error("Error cargando productos:", err));
  }, []);

  return (
    <div className="bg-ferreLight min-h-screen py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-ferreDark mb-4">🔥 Ofertas Imperdibles 🔥</h1>
          <p className="text-lg text-gray-600">Aprovecha nuestros descuentos especiales por tiempo limitado.</p>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 text-lg">No hay ofertas disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(p => <ProductCard key={p._id} product={p} addToCart={addToCart} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const Contacto = () => (
  <div className="bg-white py-12 md:py-20 px-4 md:px-6">
    <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-ferreDark mb-4">Ponte en Contacto</h1>
        <p className="text-lg text-gray-600">Estamos aquí para ayudarte. Contáctanos a través de cualquiera de estos medios.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-gray-50 p-6 md:p-8 rounded-lg border">
          <h3 className="text-2xl font-bold mb-4">Información de Contacto</h3>
          <p className="mb-2"><strong>Dirección:</strong> Cra 4 # 40 -51, Barranquilla - Atlántico</p>
          <p className="mb-2"><strong>Teléfono:</strong> +57 324 3383079</p>
          <p><strong>Email:</strong> servicios.ferrecenter@gmail.com</p>
        </div>
        <div className="bg-gray-50 p-8 rounded-lg border">
          <h3 className="text-2xl font-bold mb-4">Horarios de Atención</h3>
          <p className="mb-2"><strong>Lunes a Viernes:</strong> 7:30 a.m. - 5:30 p.m.</p>
          <p className="mb-2"><strong>Sábados:</strong> 7:30 AM - 4:30 PM</p>
          <p className="mb-2"><strong>Domingos:</strong> Cerrado</p>
          <p><strong>Festivos:</strong> 8:00 AM - 12:00 PM</p>
        </div>
      </div>
    </div>
  </div>
);

const UserProfile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    address: user.address || '',
    phone: user.phone || '',
    identification: user.identification || '',
    password: '', // Garantizamos que inicie vacío
    confirmPassword: '', // Garantizamos que inicie vacío
    imageUrl: user.imageUrl || ''
  });
  const [uploading, setUploading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    setUploading(true);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await API.post('/upload', formDataUpload, config);
      setFormData(prev => ({ ...prev, imageUrl: data }));
      setUploading(false);
    } catch (error) {
      setUploading(false);
      alert('Error subiendo imagen');
    }
  };

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/orders/myorders', config);
        setMyOrders(data);
      } catch (error) {
        console.error("Error cargando mis pedidos:", error.message);
      }
    };
    fetchMyOrders();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.put('/users/profile', formData, config);
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setMessage('Perfil actualizado correctamente');
      setError('');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar perfil');
      setMessage('');
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-ferreDark p-6 text-white">
          <h2 className="text-2xl font-bold">Mi Perfil</h2>
          <p className="text-gray-400 text-sm">Administra tu información personal y seguridad</p>
        </div>
        
        <div className="p-6 md:p-8">
          {message && <div className="bg-green-100 text-green-700 p-4 rounded mb-6">{message}</div>}
          {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
            {/* Columna Izquierda: Foto */}
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden mb-4 group">
                {formData.imageUrl ? (
                  <img src={getImageUrl(formData.imageUrl)} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-8 text-gray-400" />
                )}
                <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" />
                  <input type="file" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {uploading && <p className="text-sm text-blue-500 animate-pulse">Subiendo...</p>}
              <p className="text-xs text-gray-500 text-center mt-2">Haz clic en la imagen para cambiarla</p>
            </div>

            {/* Columna Derecha: Datos */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700">Nombre Completo</label><input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="text-sm font-medium text-gray-700">Identificación</label><input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" value={formData.identification} onChange={e => setFormData({...formData, identification: e.target.value})} /></div>
                <div><label className="text-sm font-medium text-gray-700">Teléfono</label><input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><label className="text-sm font-medium text-gray-700">Dirección</label><input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700">Correo Electrónico</label><input type="email" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} autoComplete="email" /></div>
              </div>

              <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 mt-6">Seguridad (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700">Nueva Contraseña</label><input type="password" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" placeholder="Dejar en blanco para mantener" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} autoComplete="new-password" /></div>
                <div><label className="text-sm font-medium text-gray-700">Confirmar Contraseña</label><input type="password" className="w-full border p-2 rounded focus:ring-2 focus:ring-ferreRed outline-none" placeholder="Repetir nueva contraseña" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} autoComplete="new-password" /></div>
              </div>

              <button type="submit" className="w-full bg-ferreRed text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors mt-6 shadow-lg">
                Guardar Cambios
              </button>
            </div>
          </form>

          {/* Sección de Historial de Pedidos */}
          <div className="mt-12 border-t pt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="text-ferreRed" /> Mis Pedidos Recientes
            </h3>
            
            {myOrders.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                No has realizado ninguna compra todavía. ¡Visita nuestro catálogo!
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div>
                        <p className="font-bold text-gray-800">Orden #{order._id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} - {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          order.paymentStatus === 'Pagado' ? 'bg-green-100 text-green-700' : 
                          order.paymentStatus === 'Rechazado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          <Clock size={12}/> {order.paymentStatus}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          order.deliveryStatus === 'Entregado' ? 'bg-blue-100 text-blue-700' : 
                          order.deliveryStatus === 'En Tránsito' ? 'bg-purple-100 text-purple-700' : 
                          order.deliveryStatus === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          <Package size={12}/> {order.deliveryStatus}
                        </span>
                        <span className="font-bold text-lg text-ferreDark">${order.totalPrice.toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                      <p className="font-semibold mb-1">Productos:</p>
                      <ul className="space-y-2">
                        {order.orderItems && order.orderItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <img src={getImageUrl(item.imageUrl)} alt="" className="w-8 h-8 object-contain rounded bg-white border" />
                            <span>{item.name} <span className="text-gray-400 font-bold">x{item.qty}</span></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ user }) => {
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', subcategory: '', stock: '', minStock: '', imageUrl: '', isOffer: false, offerPrice: '' });
  const [companyData, setCompanyData] = useState({ name: '', nit: '', address: '', phone: '', email: '', logoUrl: '' });
  const [userFormData, setUserFormData] = useState({ name: '', email: '', isAdmin: false, address: '', phone: '', identification: '', password: '' });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'orders', 'users', 'settings'
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    API.get('/categories').then(res => setCategories(res.data)).catch(console.error);
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchCompanyData();
  }, []);

  useEffect(() => {
    setVisibleCount(10);
  }, [inventorySearch, inventoryCategory, showOutOfStock]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products');
      setProducts(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/orders', config);
      setOrders(data);
    } catch (error) {
        console.error("Error cargando órdenes:", error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/users', config);
      setUsersList(data);
    } catch (error) {
        console.error("Error cargando usuarios:", error.message);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data } = await API.get('/company');
      setCompanyData(data);
    } catch (error) {
        console.error("Error cargando datos de empresa:", error.message);
    }
  };

  const handleCategoryChange = (e) => {
    const selectedCat = categories.find(c => (c.id || c._id).toString() === e.target.value);
    setFormData({ ...formData, category: e.target.value, subcategory: '' });
    setSubcategories(selectedCat ? selectedCat.subcategories : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editId) {
        await API.put(`/products/${editId}`, formData, config);
        alert('✅ Producto actualizado correctamente');
        setEditId(null);
      } else {
        await API.post('/products', formData, config);
        alert('✅ Producto agregado correctamente');
      }
      setFormData({ name: '', description: '', price: '', category: '', subcategory: '', stock: '', minStock: '', imageUrl: '', isOffer: false, offerPrice: '' });
      fetchProducts();
    } catch (error) {
      alert('❌ Error al guardar producto: ' + (error.response?.data?.message || error.message));
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    setUploading(true);

    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
      };
      const { data } = await API.post('/upload', formDataUpload, config);
      setFormData({ ...formData, imageUrl: data });
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
      alert('Error subiendo imagen');
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post('/company', companyData, config);
      alert('✅ Configuración de marca actualizada');
    } catch (error) {
      alert('Error actualizando configuración');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    setLogoUploading(true);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await API.post('/upload', formDataUpload, config);
      
      // Guardar la URL del logo en la configuración global
      // También actualizamos el estado local de companyData para que se refleje en el formulario
      setCompanyData(prev => ({ ...prev, logoUrl: data }));
      setLogoUploading(false);
      alert('✅ Logo actualizado correctamente');
    } catch (error) {
      console.error(error);
      setLogoUploading(false);
      alert('Error actualizando el logo');
    }
  };

  const handleEdit = (product) => {
    setEditId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory || '',
      stock: product.stock,
      minStock: product.minStock || '',
      imageUrl: product.imageUrl,
      isOffer: product.isOffer || false,
      offerPrice: product.offerPrice || ''
    });
    // Cargar subcategorías correspondientes
    const selectedCat = categories.find(c => c.name === product.category);
    setSubcategories(selectedCat ? selectedCat.subcategories : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.delete(`/products/${id}`, config);
        fetchProducts();
      } catch (error) {
        alert('Error eliminando producto');
      }
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({ name: '', description: '', price: '', category: '', subcategory: '', stock: '', minStock: '', imageUrl: '', isOffer: false, offerPrice: '' });
  };

  const handleUserEdit = (userItem) => {
    setEditingUser(userItem._id);
    setUserFormData({
      name: userItem.name,
      email: userItem.email,
      isAdmin: userItem.isAdmin,
      address: userItem.address,
      phone: userItem.phone,
      identification: userItem.identification,
      password: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.delete(`/users/${id}`, config);
        fetchUsers();
      } catch (error) {
        alert('Error eliminando usuario');
      }
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/users/${editingUser}`, userFormData, config);
      alert('✅ Usuario actualizado correctamente');
      setEditingUser(null);
      setUserFormData({ name: '', email: '', isAdmin: false, address: '', phone: '', identification: '', password: '' });
      fetchUsers();
    } catch (error) {
      alert('Error actualizando usuario');
    }
  };

  const cancelUserEdit = () => {
    setEditingUser(null);
    setUserFormData({ name: '', email: '', isAdmin: false, address: '', phone: '', identification: '', password: '' });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`¿Estás seguro de cambiar el estado de entrega a "${newStatus}"?`)) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/orders/${orderId}/status`, { deliveryStatus: newStatus }, config);
      await fetchOrders(); // Recargar órdenes para reflejar el cambio
      alert('¡Estado del pedido actualizado!');
    } catch (error) {
      console.error("Error actualizando estado:", error.message);
      alert('No se pudo actualizar el estado del pedido.');
    }
  };

  const handleOrderDelete = async (orderId) => {
    if (window.confirm('⚠️ ¿Estás seguro de eliminar este pedido permanentemente?\n\nEsta acción borrará el pedido del historial del administrador y del cliente. No se puede deshacer.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.delete(`/orders/${orderId}`, config);
        await fetchOrders(); // Recargar la lista
        alert('✅ Pedido eliminado correctamente.');
      } catch (error) {
        console.error("Error eliminando pedido:", error.message);
        alert('❌ Error al eliminar el pedido.');
      }
    }
  };

  const filteredInventory = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = inventoryCategory ? product.category === inventoryCategory : true;
    const matchesStock = showOutOfStock ? product.stock <= (product.minStock || 0) : true;
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-ferreDark p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <span className="bg-ferreRed px-3 py-1 rounded text-xs font-bold uppercase">Modo Admin</span>
        </div>
        
        {/* Navegación de Pestañas */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setActiveTab('inventory')} className={`flex-shrink-0 md:flex-1 min-w-[120px] py-4 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'inventory' ? 'text-ferreRed border-b-2 border-ferreRed bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}>
            <Package size={20} /> Inventario
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex-shrink-0 md:flex-1 min-w-[120px] py-4 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'orders' ? 'text-ferreRed border-b-2 border-ferreRed bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}>
            <ShoppingBag size={20} /> Pedidos ({orders.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex-shrink-0 md:flex-1 min-w-[120px] py-4 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'text-ferreRed border-b-2 border-ferreRed bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}>
            <Users size={20} /> Usuarios ({usersList.length})
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-shrink-0 md:flex-1 min-w-[120px] py-4 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'text-ferreRed border-b-2 border-ferreRed bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}>
            <Settings size={20} /> Configuración
          </button>
        </div>

        <div className="p-4 md:p-8">
          {activeTab === 'inventory' && (
            <>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-700">{editId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
                {editId && <button onClick={cancelEdit} className="text-sm text-red-500 hover:underline flex items-center gap-1"><X size={16}/> Cancelar Edición</button>}
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none shadow-sm" value={formData.category} onChange={handleCategoryChange} required>
                      <option value="">Seleccionar Categoría</option>
                      {categories.map(cat => <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  {subcategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
                      <select className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none shadow-sm" value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})}>
                        <option value="">Seleccionar Subcategoría</option>
                        {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <input type="number" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none shadow-sm" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input type="number" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none shadow-sm" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                      <input type="number" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none shadow-sm" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} placeholder="0" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="isOffer" checked={formData.isOffer} onChange={e => setFormData({...formData, isOffer: e.target.checked})} className="w-4 h-4 text-ferreRed" />
                    <label htmlFor="isOffer" className="text-sm font-bold text-orange-800">¿Es una Oferta Especial?</label>
                  </div>
                  {formData.isOffer && (
                    <div>
                      <label className="block text-xs font-bold text-orange-700 mb-1 uppercase">Precio de Oferta (Especial)</label>
                      <input type="number" className="w-full border border-orange-300 p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={formData.offerPrice} onChange={e => setFormData({...formData, offerPrice: e.target.value})} placeholder="Ej: 45000" required={formData.isOffer} />
                      <p className="text-[10px] text-orange-600 mt-1">* Se mostrará este precio y el original tachado.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none h-32 resize-none shadow-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition">
                    <label className="cursor-pointer block">
                      <span className="block text-sm font-medium text-gray-700 mb-2">Imagen del Producto</span>
                      <input type="file" onChange={uploadFileHandler} className="hidden"/>
                      <div className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-md inline-block hover:text-ferreRed">Seleccionar Archivo</div>
                    </label>
                    {uploading && <p className="text-sm text-blue-500 mt-2 animate-pulse">Subiendo imagen...</p>}
                    {formData.imageUrl && <p className="text-sm text-green-600 mt-2 font-medium">✅ Imagen cargada correctamente</p>}
                  </div>
                </div>

                <div className="md:col-span-2 mt-4">
                  <button type="submit" className={`w-full text-white py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 ${editId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gradient-to-r from-ferreRed to-[#991116] hover:shadow-red-600/40'}`}>
                    {editId ? 'Actualizar Producto' : 'Guardar Producto en Inventario'}
                  </button>
                </div>
              </form>

              {/* Lista de Productos */}
              <div className="mt-16">
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b pb-2 gap-4">
                  <h3 className="text-xl font-semibold text-gray-700">Inventario Actual ({filteredInventory.length})</h3>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none"
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                      />
                    </div>
                    <select className="py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none bg-white" value={inventoryCategory} onChange={(e) => setInventoryCategory(e.target.value)}>
                      <option value="">Todas las Categorías</option>
                      {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <button 
                      onClick={() => setShowOutOfStock(!showOutOfStock)}
                      className={`py-2 px-4 border rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${showOutOfStock ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {showOutOfStock ? <X size={16} /> : <Filter size={16} />}
                      {showOutOfStock ? 'Ver Todos' : 'Ver Bajo Stock'}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                        <th className="p-4 border-b">Producto</th>
                        <th className="p-4 border-b">Categoría</th>
                        <th className="p-4 border-b">Precio</th>
                        <th className="p-4 border-b">Stock</th>
                        <th className="p-4 border-b text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {filteredInventory.slice(0, visibleCount).map(product => (
                        <tr key={product._id} className="hover:bg-gray-50 transition-colors border-b last:border-none">
                          <td className="p-4 flex items-center gap-3">
                          <img src={getImageUrl(product.imageUrl)} alt="" className="w-10 h-10 object-contain rounded bg-white border" />
                            <div>
                              <p className="font-bold">{product.name}</p>
                              {product.price < 50000 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">🔥 Oferta</span>}
                            </div>
                          </td>
                          <td className="p-4">{product.category} <br/><span className="text-xs text-gray-400">{product.subcategory}</span></td>
                          <td className="p-4 font-medium">${product.price.toLocaleString('es-CO')}</td>
                          <td className={`p-4 ${product.stock <= 0 ? 'text-red-600 font-bold' : product.stock <= (product.minStock || 0) ? 'text-orange-600 font-bold' : ''}`}>
                            {product.stock}
                            {product.stock <= (product.minStock || 0) && <span className="block text-xs text-red-500 font-bold">Reabastecer</span>}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar"><Edit size={18} /></button>
                              <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredInventory.length > visibleCount && (
                  <div className="mt-6 text-center">
                    <button onClick={() => setVisibleCount(prev => prev + 10)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-6 rounded-full shadow-sm transition-all">
                      Cargar más productos
                    </button>
                    <p className="text-xs text-gray-400 mt-2">Mostrando {visibleCount} de {filteredInventory.length} productos</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-gray-700 border-b pb-2">Historial de Pedidos</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500">No hay pedidos registrados.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">Orden #{order._id.substring(0, 8)}</p>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} - {new Date(order.createdAt).toLocaleTimeString()}</p>
                          <p className="text-sm font-medium mt-1">Cliente: {order.user?.name || 'Usuario Eliminado'} ({order.user?.email})</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">${order.totalPrice.toLocaleString('es-CO')}</span>
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <span title="Estado de Pago" className={`px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                              order.paymentStatus === 'Pagado' ? 'bg-green-100 text-green-700' : 
                              order.paymentStatus === 'Rechazado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.paymentStatus === 'Pagado' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                              {order.paymentStatus || 'Pendiente'}
                            </span>
                            <select 
                              value={order.deliveryStatus || 'Pendiente'} 
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className={`text-xs p-1 border rounded-md shadow-sm focus:ring-ferreRed focus:border-ferreRed font-bold cursor-pointer ${
                                order.deliveryStatus === 'Entregado' ? 'text-blue-700 bg-blue-50 border-blue-200' : 
                                order.deliveryStatus === 'En Tránsito' ? 'text-purple-700 bg-purple-50 border-purple-200' : 
                                order.deliveryStatus === 'Cancelado' ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-white'
                              }`}
                              onClick={(e) => e.stopPropagation()} // Evita que el click se propague
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="En Tránsito">En Tránsito</option>
                              <option value="Entregado">Entregado</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                            <button onClick={() => handleOrderDelete(order._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" title="Eliminar Pedido Permanentemente">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 border-t pt-2">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Productos:</p>
                        <ul className="text-sm text-gray-700 space-y-2">
                          {order.orderItems && order.orderItems.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <img src={getImageUrl(item.imageUrl)} alt="" className="w-8 h-8 object-contain rounded bg-white border" />
                              <span>{item.name} <span className="font-bold text-ferreRed">x{item.qty}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {editingUser && (
                <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">Editar Usuario</h3>
                    <button onClick={cancelUserEdit} className="text-sm text-red-500 hover:underline flex items-center gap-1"><X size={16}/> Cancelar</button>
                  </div>
                  <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">Nombre</label><input type="text" className="w-full border p-2 rounded" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} required /></div>
                    <div><label className="text-sm font-medium">Email</label><input type="email" className="w-full border p-2 rounded" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} required autoComplete="email" /></div>
                    <div><label className="text-sm font-medium">Teléfono</label><input type="text" className="w-full border p-2 rounded" value={userFormData.phone} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} /></div>
                    <div><label className="text-sm font-medium">Identificación</label><input type="text" className="w-full border p-2 rounded" value={userFormData.identification} onChange={e => setUserFormData({...userFormData, identification: e.target.value})} /></div>
                    <div><label className="text-sm font-medium">Nueva Contraseña (Opcional)</label><input type="password" className="w-full border p-2 rounded" placeholder="Dejar en blanco para mantener" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="text-sm font-medium">Dirección</label><input type="text" className="w-full border p-2 rounded" value={userFormData.address} onChange={e => setUserFormData({...userFormData, address: e.target.value})} /></div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="isAdmin" checked={userFormData.isAdmin} onChange={e => setUserFormData({...userFormData, isAdmin: e.target.checked})} className="w-4 h-4 text-ferreRed" />
                      <label htmlFor="isAdmin" className="text-sm font-medium">Es Administrador</label>
                    </div>
                    <div className="md:col-span-2">
                      <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 font-bold w-full">Actualizar Usuario</button>
                    </div>
                  </form>
                </div>
              )}

              <h3 className="text-xl font-semibold mb-6 text-gray-700 border-b pb-2">Lista de Usuarios Registrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                      <th className="p-4 border-b">Usuario</th>
                      <th className="p-4 border-b">Contacto</th>
                      <th className="p-4 border-b">Rol</th>
                      <th className="p-4 border-b text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {usersList.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors border-b last:border-none">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {u.imageUrl ? <img src={getImageUrl(u.imageUrl)} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-gray-500" />}
                          </div>
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <p className="text-xs text-gray-500">CC: {u.identification || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p>{u.email}</p>
                          <p className="text-xs text-gray-500">{u.phone}</p>
                        </td>
                        <td className="p-4">
                          {u.isAdmin ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Admin</span> : <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Cliente</span>}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleUserEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar"><Edit size={18} /></button>
                            <button onClick={() => handleUserDelete(u._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-gray-700 border-b pb-2">Configuración de Marca</h3>
              
              <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-20 h-20 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
                    {companyData.logoUrl ? <img src={getImageUrl(companyData.logoUrl)} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Logo de la Empresa</p>
                    <p className="text-sm text-gray-500">Este logo aparecerá en el encabezado de las facturas PDF.</p>
                  </div>
                </div>
                <label className="cursor-pointer bg-white border border-gray-300 hover:border-ferreRed text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 w-full md:w-auto justify-center">
                  {logoUploading ? 'Subiendo...' : 'Cambiar Logo'}
                  <input type="file" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <form onSubmit={handleCompanySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                  <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none" value={companyData.name} onChange={e => setCompanyData({...companyData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Identificación</label>
                  <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none" value={companyData.nit} onChange={e => setCompanyData({...companyData, nit: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
                  <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none" value={companyData.email} onChange={e => setCompanyData({...companyData, email: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Principal</label>
                  <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed outline-none" value={companyData.address} onChange={e => setCompanyData({...companyData, address: e.target.value})} />
                </div>
                <div className="md:col-span-2 mt-4">
                  <button type="submit" className="w-full bg-ferreDark text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-gray-800 transition-all">
                    Guardar Información de la Empresa
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/users/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
    } catch (err) {
      setError('Usuario o contraseña incorrecta');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-ferreLight">
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <img src="/LoFerTrasn.png" alt="FerreCenter" className="h-16 md:h-24 object-contain mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">Bienvenido</h2>
          <p className="text-gray-500 mt-2">Ingresa a tu cuenta para continuar</p>
        </div>
        
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <input type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="ejemplo@ferrecenter.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-ferreDark to-[#1a1a1a] text-white py-3.5 rounded-lg hover:from-ferreRed hover:to-[#991116] font-bold transition-all duration-300 shadow-lg hover:shadow-xl">
            Iniciar Sesión
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-8">
          ¿Olvidaste tu contraseña? <Link to="/forgot-password" className="text-ferreRed hover:underline">Recuperar</Link>
        </p>
      </div>
    </div>
  );
};

// Componente para Olvidé Contraseña
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await API.post('/users/forgot-password', { email });
      setMessage('Si existe una cuenta con ese correo, recibirás una nueva contraseña temporal.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-ferreLight">
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <img src="/LoFerTrasn.png" alt="FerreCenter" className="h-16 md:h-24 object-contain mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">Recuperar Contraseña</h2>
          <p className="text-gray-500 mt-2">Ingresa tu correo para recibir una nueva contraseña.</p>
        </div>
        
        {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 text-sm rounded">{message}</div>}
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <input type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="ejemplo@ferrecenter.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ferreDark to-[#1a1a1a] text-white py-3.5 rounded-lg hover:from-ferreRed hover:to-[#991116] font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-8">
          <Link to="/login" className="text-ferreRed hover:underline">Volver a Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  );
};

// Componente para Restablecer Contraseña
const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setError('');
        setMessage('');

        try {
            await API.put(`/users/reset-password/${token}`, { password });
            setMessage('¡Contraseña actualizada con éxito! Serás redirigido para iniciar sesión en 3 segundos.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al restablecer la contraseña.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-ferreLight">
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <img src="/LoFerTrasn.png" alt="FerreCenter" className="h-16 md:h-24 object-contain mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800">Nueva Contraseña</h2>
                    <p className="text-gray-500 mt-2">Ingresa tu nueva contraseña.</p>
                </div>

                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 text-sm rounded">{message}</div>}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="••••••••" required autoComplete="new-password" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="••••••••" required autoComplete="new-password" />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-ferreDark to-[#1a1a1a] text-white py-3.5 rounded-lg hover:from-ferreRed hover:to-[#991116] font-bold transition-all duration-300 shadow-lg hover:shadow-xl mt-2">
                        Actualizar Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
};

// Componente para Crear Cuenta
const Register = ({ setUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [identification, setIdentification] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const { data } = await API.post('/users', { name, email, password, address, phone, identification });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-ferreLight">
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <img src="/LoFerTrasn.png" alt="FerreCenter" className="h-16 md:h-24 object-contain mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">Crear Cuenta</h2>
          <p className="text-gray-500 mt-2">Únete a FerreCenter hoy</p>
        </div>
        
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm rounded">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="Juan Pérez" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula o NIT</label>
            <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="123456789" value={identification} onChange={e => setIdentification(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / Celular</label>
            <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="300 123 4567" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Entrega</label>
            <input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="Cra 4 # 40 - 51" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm" placeholder="ejemplo@ferrecenter.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-ferreRed focus:border-transparent outline-none transition shadow-sm pr-10" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-ferreDark to-[#1a1a1a] text-white py-3.5 rounded-lg hover:from-ferreRed hover:to-[#991116] font-bold transition-all duration-300 shadow-lg hover:shadow-xl mt-2">
            Registrarse
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-8">
          ¿Ya tienes cuenta? <Link to="/login" className="text-ferreRed hover:underline">Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  );
};

// Componente para Ayuda
const Help = () => {
  const faqs = [
    { q: "¿Cómo puedo realizar un pedido?", a: "Navega por nuestro catálogo, agrega los productos deseados al carrito y haz clic en el botón 'Proceder al Pago'." },
    { q: "¿Cuáles son los métodos de pago?", a: "Aceptamos tarjetas de crédito, débito y pagos en efectivo contra entrega en zonas seleccionadas." },
    { q: "¿Hacen envíos a todo el país?", a: "Sí, realizamos envíos a nivel nacional. El envío es gratuito por compras superiores a $100.000." },
    { q: "¿Puedo devolver un producto?", a: "Tienes 30 días para devoluciones si el producto está en su empaque original y presentas la factura." }
  ];

  return (
    <div className="bg-ferreLight min-h-screen py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-ferreDark mb-4">Centro de Ayuda</h2>
          <p className="text-gray-600 text-lg">¿Tienes dudas? Aquí te ayudamos.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-ferreRed mb-2 flex items-center gap-2">
                <span className="bg-red-100 p-1 rounded text-sm">?</span> {faq.q}
              </h3>
              <p className="text-gray-700 ml-8">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-ferreDark text-white p-8 rounded-2xl text-center shadow-2xl">
          <h3 className="text-2xl font-bold mb-4">¿Aún necesitas ayuda?</h3>
          <p className="text-gray-300 mb-6">Nuestro equipo de soporte está disponible 24/7 para atenderte.</p>
          <a href="mailto:soporte@ferrecenter.com" className="inline-block bg-ferreRed hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-colors">
            Contáctanos
          </a>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [animatingItem, setAnimatingItem] = useState(null);
  const cartIconRef = useRef(null);

  const addToCart = (product, e) => {
    // Normalizar el ID para asegurar una comparación precisa
    const productId = product.id || product._id;

    if (product.stock <= 0) {
      alert('Este producto está agotado.');
      return;
    }

    // --- Lógica de Animación ---
    if (e && cartIconRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cartRect = cartIconRef.current.getBoundingClientRect();

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      setAnimatingItem({
        id: Date.now(),
        imageUrl: getImageUrl(product.imageUrl),
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
        endX: cartRect.left + cartRect.width / 2,
        endY: cartRect.top + cartRect.height / 2,
      });

      // Limpiar animación después de que termine (800ms)
      setTimeout(() => {
        setAnimatingItem(null);
      }, 800);
    }

    setCart(prevCart => {
      const exist = prevCart.find(item => (item.id || item._id) === productId);
      if (exist) {
        // AGREGACIÓN: Si ya existe, sumamos a la cantidad actual
        const newQty = exist.qty + 1;
        if (newQty > product.stock) {
          alert(`Stock máximo alcanzado (${product.stock} unidades).`);
          return prevCart;
        }
        return prevCart.map(item =>
          (item.id || item._id) === productId ? { ...item, qty: newQty } : item
        );
      } else {
        // Si es nuevo, lo agregamos con qty: 1
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => (item.id || item._id) !== productId));
  };

  const updateCartQty = (productId, qty) => {
    const numQty = parseInt(qty, 10);
    if (isNaN(numQty)) return;

    setCart(prevCart =>
      prevCart.map(item => {
        const currentId = item.id || item._id;
        if (currentId === productId) {
          if (numQty > 0 && numQty <= item.stock) {
            return { ...item, qty: numQty };
          } else if (numQty > item.stock) {
            alert(`Solo hay ${item.stock} unidades disponibles en inventario.`);
            return { ...item, qty: item.stock };
          }
        }
        return item;
      }).filter(item => item.qty > 0) // Elimina si la cantidad es 0 o menos
    );
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <style>
        {`
          @keyframes flyToCart {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            20% {
              transform: translate(0, -20px) scale(1.1);
              opacity: 1;
            }
            100% {
              transform: translate(var(--tx), var(--ty)) scale(0.1);
              opacity: 0;
            }
          }
          .floating-product {
            position: fixed;
            top: var(--startY);
            left: var(--startX);
            width: 60px;
            height: 60px;
            object-fit: contain;
            z-index: 9999;
            pointer-events: none;
            background: white;
            border-radius: 50%;
            padding: 5px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            animation: flyToCart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>
      <div className="min-h-screen bg-ferreLight font-sans text-gray-800 flex flex-col">
        <Navbar 
          user={user} 
          cartCount={cart.reduce((acc, item) => acc + (item.qty || 0), 0)} 
          logout={logout} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          cartIconRef={cartIconRef}
        />

        {animatingItem && (
          <img
            key={animatingItem.id}
            src={animatingItem.imageUrl}
            className="floating-product"
            style={{
              '--startX': `${animatingItem.startX - 30}px`,
              '--startY': `${animatingItem.startY - 30}px`,
              '--tx': `${animatingItem.endX - animatingItem.startX}px`,
              '--ty': `${animatingItem.endY - animatingItem.startY}px`,
            }}
            alt=""
          />
        )}

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} searchTerm={searchTerm} />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/catalogo" element={<Catalogo addToCart={addToCart} searchTerm={searchTerm} />} />
            <Route path="/cotizar" element={user ? <Cotizar user={user} /> : <Navigate to="/login" />} />
            <Route path="/ofertas" element={<Ofertas addToCart={addToCart} />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/profile" element={user ? <UserProfile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register setUser={setUser} />} />
            <Route path="/help" element={<Help />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/admin" element={user && user.isAdmin ? <AdminPanel user={user} /> : <Navigate to="/" />} />
            <Route path="/cart" element={<CartPage cart={cart} user={user} removeFromCart={removeFromCart} setCart={setCart} updateCartQty={updateCartQty} />} />
          </Routes>
        </div>
        <footer className="bg-gray-800 text-white py-10 mt-auto">
          <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <Link to="/" className="inline-block mb-4">
                <img src="/LoFerTrasn.png" alt="FerreCenter" className="h-20 object-contain" translate="no" />
              </Link>
              <p className="text-gray-400 text-sm">Tu aliado confiable en construcción y herramientas. Calidad garantizada en cada producto.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/nosotros" className="hover:text-white">Nosotros</Link></li>
                <li><Link to="/catalogo" className="hover:text-white">Catálogo</Link></li>
                {user && <li><Link to="/cotizar" className="hover:text-white">Cotizar</Link></li>}
                <li><Link to="/ofertas" className="hover:text-white">Ofertas</Link></li>
                <li><Link to="/contacto" className="hover:text-white">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <p className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-ferreRed flex-shrink-0" />
                Cra 4 # 40 -51, Barranquilla - Atlántico
              </p>
              <p className="text-gray-400 text-sm flex items-center gap-2 mb-2">
                <Mail size={16} className="text-ferreRed flex-shrink-0" />
                servicios.ferrecenter@gmail.com
              </p>
              <a href="https://wa.me/573243383079?text=Te%20damos%20la%20bienvenida%20a%20FerreCenter%2C%20tu%20ferreter%C3%ADa%20de%20confianza!%20Cu%C3%A9ntanos%2C%20c%C3%B3mo%20podemos%20ayudarte" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm flex items-center gap-2 mb-2 hover:text-green-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-green-500 flex-shrink-0"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                +57 324 3383079
              </a>
              <a href="https://www.instagram.com/ferrecenterbq?igsh=cmU3eXZqdXl0Mzc3" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm flex items-center gap-2 hover:text-pink-500 transition-colors">
                <Instagram size={16} className="text-pink-500 flex-shrink-0" />
                Instagram
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
            &copy; 2026 <span translate="no">FerreCenter</span>. Todos los derechos reservados. | Desarrollado por  <a href="https://www.grisalistech.com/" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-white transition-colors cursor-pointer" translate="no">Grisalis Technologies</a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
