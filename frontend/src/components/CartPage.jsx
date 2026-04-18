import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Trash2, CreditCard, UploadCloud, FileCheck, Loader } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API = axios.create({ baseURL: `${SERVER_URL}/api` });

// Helper para manejar URLs de imágenes (Supabase vs Local)
const getImageUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER_URL}${url}`;
};

const CartPage = ({ cart, user, removeFromCart, setCart, updateCartQty }) => {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Función para obtener el precio real que se debe cobrar (Oferta vs Normal)
  const getItemPrice = (item) => {
    return (item.isOffer && item.offerPrice) ? item.offerPrice : item.price;
  };

  const handleFileChange = (e) => {
    setProof(e.target.files[0]);
    setError('');
  };

  const handleSendWithProof = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    if (!proof) {
      setError('Por favor, sube tu comprobante de pago.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const totalPrice = cart.reduce((acc, item) => acc + (getItemPrice(item) * item.qty), 0);
    const orderItems = cart.map(item => ({
      name: item.name,
      qty: item.qty,
      imageUrl: item.imageUrl, // Sincronizado con el backend (image_url)
      price: getItemPrice(item), // Enviamos el precio de oferta al backend
      product: item._id || item.id
    }));

    try {
      // 1. Crear la orden para obtener el ID
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: createdOrder } = await API.post('/orders', { orderItems, totalPrice }, config);

      // 2. Preparar FormData para enviar el comprobante
      const formData = new FormData();
      formData.append('orderId', createdOrder._id);
      formData.append('proof', proof);

      // 3. Enviar la orden con el comprobante
      await API.post('/orders/send-with-proof', formData, {
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('¡Pedido enviado! Recibirás una confirmación por correo. Gracias por tu compra.');
      setCart([]);
      setProof(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Hubo un error al procesar tu pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((acc, item) => acc + (getItemPrice(item) * item.qty), 0);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
        <ShoppingCart className="text-ferreRed" /> Tu Carrito de Compras
      </h2>
      {cart.length === 0 && !success ? (
        <p className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">El carrito está vacío.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Items del Carrito o Mensaje de Éxito */}
          <div className="lg:col-span-2">
            {success ? (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-6 rounded-lg shadow-md text-center">
                <FileCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">¡Pedido Enviado Exitosamente!</h3>
                <p>{success}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item._id || item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={getImageUrl(item.imageUrl)} 
                        alt={item.name} 
                        className="h-full w-full object-contain select-none pointer-events-none" 
                        onContextMenu={(e) => e.preventDefault()}
                        draggable="false"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/100'} 
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.category}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">Precio Unit: <span className="text-ferreRed">${getItemPrice(item).toLocaleString('es-CO')}</span></span>
                        {item.isOffer && (
                          <span className="text-xs text-gray-400 line-through decoration-gray-400/50">${item.price.toLocaleString('es-CO')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <label htmlFor={`qty-${item._id || item.id}`} className="text-sm font-medium text-gray-600">Cantidad:</label>
                        <input
                          id={`qty-${item._id || item.id}`}
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateCartQty(item._id || item.id, e.target.value)}
                          min="1"
                          max={item.stock}
                          className="w-20 p-1 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-ferreRed outline-none"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex justify-between items-center sm:block sm:text-right mt-2 sm:mt-0">
                      <div className="flex flex-col sm:items-end">
                        <p className="font-bold text-lg text-ferreRed">${(getItemPrice(item) * item.qty).toLocaleString('es-CO')}</p>
                        {item.isOffer && (
                          <p className="text-xs text-gray-400 line-through decoration-red-500/50">${(item.price * item.qty).toLocaleString('es-CO')}</p>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item._id || item.id)} className="text-red-500 text-sm hover:underline flex items-center gap-1 justify-end mt-1">
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Columna Derecha: Resumen y Formulario de Pago */}
          {!success && cart.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg h-fit border border-gray-100">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Resumen del Pedido</h3>
              <div className="space-y-2 mb-6 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${total.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-xl text-gray-900">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-CO')}</span>
                </div>
              </div>
              
              <form onSubmit={handleSendWithProof} className="space-y-4">
                <div>
                  <label htmlFor="proof-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Sube tu Comprobante de Pago
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-ferreRed hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ferreRed">
                          <span>Sube un archivo</span>
                          <input id="proof-upload" name="proof-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" />
                        </label>
                        <p className="pl-1">o arrástralo aquí</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF hasta 10MB
                      </p>
                      {proof && <p className="text-sm font-semibold text-green-600 mt-2">{proof.name}</p>}
                    </div>
                  </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-3 text-sm rounded-md">{error}</div>}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-ferreRed to-[#991116] text-white py-4 rounded-lg font-bold hover:shadow-red-600/40 shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Enviar Pedido con Comprobante
                    </>
                  )}
                </button>
              </form>
              <p className="text-xs text-center text-gray-400 mt-4">
                Tu pedido será procesado una vez verifiquemos el pago.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartPage;
