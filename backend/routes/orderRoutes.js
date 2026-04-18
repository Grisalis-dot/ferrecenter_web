const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const axios = require('axios'); // Para descargar la imagen del logo
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper para generar PDF de Factura con diseño profesional
async function generateInvoicePDF(order, user, company) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  const pdfPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  // --- Estilos y Colores ---
  const primaryColor = '#C50000'; // FerreCenter Red
  const fontColor = '#333333';

  // --- Encabezado ---
  if (company.logo_url) {
    try {
      // Descargar la imagen del logo desde la URL
      const response = await axios.get(company.logo_url, { responseType: 'arraybuffer' });
      const logoBuffer = Buffer.from(response.data);
      doc.image(logoBuffer, 50, 45, { width: 80 });
    } catch (logoError) {
      console.error('Error al cargar el logo para el PDF:', logoError.message);
      // Continuar sin logo si falla la carga
    }
  }
  doc
    .fillColor(fontColor)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(company?.name || 'FerreCenter', 200, 50, { align: 'right' })
    .fontSize(10)
    .font('Helvetica')
    .text(`NIT: ${company?.nit || 'N/A'}`, 200, 70, { align: 'right' })
    .text(company?.address || 'Dirección no disponible', 200, 85, { align: 'right' })
    .text(`${company?.phone || 'Teléfono no disponible'}`, 200, 100, { align: 'right' })
    .text(company?.email || 'email@example.com', 200, 115, { align: 'right' });

  // --- Título y Datos de Factura ---
  doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('FACTURA', 50, 160);
  doc.strokeColor(primaryColor).lineWidth(1).moveTo(50, 185).lineTo(550, 185).stroke();
  const invoiceNumber = order.order_id ? `FAC - ${order.order_id.toString().padStart(3, '0')}` : `REF - ${order.id.toString().substring(0, 8)}`;
  doc.fontSize(10).fillColor(fontColor).text(`Factura #: ${invoiceNumber}`, 200, 165, { align: 'right' });

  // --- Datos del Cliente ---
  doc.fontSize(12).font('Helvetica-Bold').text('Facturar a:', 50, 210);
  doc.font('Helvetica').fontSize(10)
    .text(user.name, 50, 225)
    .text(user.address || 'N/A', 50, 240)
    .text(`CC/NIT: ${user.identification || 'N/A'}`, 50, 255)
    .text(user.phone || 'N/A', 50, 270)
    .text(user.email, 50, 285);

  // --- Tabla de Productos ---
  const tableTop = 330;
  const itemCol = 50;
  const descCol = 100;
  const qtyCol = 280;
  const priceCol = 340;
  const totalCol = 450;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('#', itemCol, tableTop);
  doc.text('Producto', descCol, tableTop);
  doc.text('Cantidad', qtyCol, tableTop, { width: 60, align: 'right' });
  doc.text('Precio Uni.', priceCol, tableTop, { width: 90, align: 'right' });
  doc.text('Subtotal', totalCol, tableTop, { width: 100, align: 'right' });
  
  const tableBottom = tableTop + 20;
  doc.moveTo(itemCol, tableBottom).lineTo(550, tableBottom).strokeColor('#cccccc').stroke();
  doc.font('Helvetica');

  let y = tableBottom;
  order.order_items.forEach((item, i) => {
    y += 30;
    const subtotal = item.qty * item.price;
    doc.fontSize(10).text(i + 1, itemCol, y);
    doc.text(item.name, descCol, y, { width: 180 });
    doc.text(item.qty, qtyCol, y, { width: 60, align: 'right' });
    doc.text(`$${item.price.toLocaleString('es-CO')}`, priceCol, y, { width: 90, align: 'right' });
    doc.text(`$${subtotal.toLocaleString('es-CO')}`, totalCol, y, { width: 100, align: 'right' });
    if (i < order.order_items.length - 1) doc.moveTo(itemCol, y + 20).lineTo(550, y + 20).strokeColor('#eeeeee').stroke();
  });

  // --- Total General y Mensaje Final ---
  const totalY = y + 40;
  doc.strokeColor('#cccccc').moveTo(350, totalY).lineTo(550, totalY).stroke();
  doc.font('Helvetica-Bold').fontSize(12).text('Total General:', 350, totalY + 10, { align: 'left' }).text(`$${order.total_price.toLocaleString('es-CO')}`, 0, totalY + 10, { align: 'right' });
  doc.strokeColor('#cccccc').moveTo(350, totalY + 30).lineTo(550, totalY + 30).stroke();
  doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('¡Gracias por su compra!', 50, doc.page.height - 100, { align: 'center', width: 500 });

  doc.end();
  return pdfPromise;
}

// Crear nueva orden
router.post('/', protect, async (req, res) => {
  const { orderItems, totalPrice } = req.body;
  const supabase = req.app.get('supabase');

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: 'No hay ítems en la orden' });
  }

  try {
    // Validación de stock
    for (const item of orderItems) {
      const { data: product } = await supabase.from('products').select('stock').eq('id', item.product).single();
      if (!product) return res.status(404).json({ message: `Producto no encontrado: ${item.name}` });
      if (product.stock < item.qty) return res.status(400).json({ message: `Stock insuficiente para: ${item.name}` });
    }

    // Insertar orden (order_id es SERIAL)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: req.user._id,
        total_price: totalPrice,
        is_paid: false,
        payment_status: 'Pendiente',
        delivery_status: 'Pendiente'
      }])
      .select().single();

    if (orderError) throw orderError;

    const itemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product,
      name: item.name,
      qty: item.qty,
      price: item.price,
      image_url: item.imageUrl // Guardamos la imagen en el detalle de la orden
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    res.status(201).json({ ...order, _id: order.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirmar pago de orden (Llamado tras éxito en Wompi)
router.put('/:id/pay', protect, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', req.params.id)
    .single();

  if (order && !fetchError) {
    // --- EVITAR DOBLE PROCESAMIENTO ---
    if (order.is_paid) {
      return res.json(order); // Si ya estaba pagada, no hacemos nada más
    }

    await supabase.from('orders').update({ is_paid: true, paid_at: new Date(), payment_status: 'Pagado' }).eq('id', req.params.id);

    // Descontar stock (RPC sugerido en pasos anteriores)
    for (const item of order.order_items) {
      await supabase.rpc('decrement_stock', { row_id: item.product_id, quantity: item.qty });
    }

    // --- Enviar Notificación de Compra al Admin ---
    try {
      const user = req.user; // El middleware 'protect' ya nos da el usuario completo
      const { data: company } = await supabase.from('company_profile').select('*').single();
      
      const orderIdFormatted = order.order_id ? `FAC - ${order.order_id.toString().padStart(3, '0')}` : order.id.toString().substring(0, 8);
      const itemsList = order.order_items.map(item => `- ${item.name} (x${item.qty}) - $${item.price.toLocaleString('es-CO')}`).join('\n');
      
      const message = `
        ¡Nueva Compra Realizada en la Web! 🎉

        --- Datos del Cliente ---
        Nombre: ${user.name}
        Identificación: ${user.identification || 'No registrada'}
        Teléfono: ${user.phone || 'No registrado'}
        Dirección: ${user.address || 'No registrada'}
        Correo: ${user.email}

        --- Detalles del Pedido ---
        ID Orden: ${orderIdFormatted}
        Total Pagado: $${order.total_price.toLocaleString('es-CO')}
        
        Productos:
        ${itemsList}
      `;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: {
          rejectUnauthorized: false
        }
      });

      // --- GENERAR PDF DE LA FACTURA (NUEVO DISEÑO) ---
      const pdfBuffer = await generateInvoicePDF({ ...order, is_paid: true, order_items: order.order_items }, user, company);

      // --- ENVIAR CORREO AL ADMIN ---
      await transporter.sendMail({
        from: `"Sistema de Ventas" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Correo de la empresa
        subject: `Nueva Venta - Orden #${orderIdFormatted}`,
        text: message,
        attachments: [
          {
            filename: `Factura-${order.id}.pdf`,
            content: pdfBuffer
          }
        ]
      });

      // --- ENVIAR CORREO AL CLIENTE ---
      await transporter.sendMail({
        from: `"FerreCenter" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Confirmación de Pedido - Orden #${orderIdFormatted}`,
        text: `Hola ${user.name},\n\nGracias por tu compra en FerreCenter. Adjunto encontrarás la factura de tu pedido.\n\nTotal: $${order.total_price.toLocaleString('es-CO')}\n\nAtentamente,\nEl equipo de FerreCenter`,
        attachments: [
          {
            filename: `Factura-${order.id}.pdf`,
            content: pdfBuffer
          }
        ]
      });
    } catch (error) {
      console.error("Error enviando correo de notificación de venta:", error.message);
      // No detenemos la respuesta si falla el correo, la orden ya se creó
    }

    res.json({ ...order, is_paid: true, _id: order.id });
  } else {
    res.status(404).json({ message: 'Orden no encontrada' });
  }
});

// Actualizar estado de entrega de una orden (Solo Admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, profiles(name, email)')
    .eq('id', req.params.id)
    .single();

  if (order && !fetchError) {
    const { deliveryStatus } = req.body;
    const userToNotify = order.profiles;

    // Validar que el estado sea uno de los permitidos
    if (!['Pendiente', 'En Tránsito', 'Entregado', 'Cancelado'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Estado de entrega no válido.' });
    }

    const updateFields = { delivery_status: deliveryStatus };

    // Si se marca como 'Entregado', actualizamos los campos correspondientes
    if (deliveryStatus === 'Entregado') {
      updateFields.is_delivered = true;
      updateFields.delivered_at = new Date();
    }

    if ((deliveryStatus === 'En Tránsito' || deliveryStatus === 'Entregado') && order.payment_status === 'Pendiente') {
      updateFields.payment_status = 'Pagado';
      updateFields.is_paid = true;
      updateFields.paid_at = new Date();
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ message: 'Error al actualizar orden' });

    // --- NOTIFICAR AL CLIENTE POR CORREO ---
    if (userToNotify && userToNotify.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          tls: {
            rejectUnauthorized: false
          }
        });

        const orderIdFormatted = order.order_id ? `FAC - ${order.order_id.toString().padStart(3, '0')}` : order.id.toString().substring(0, 8);
        let emailBody = '';

        // Construir el mensaje según el estado del pedido
        switch (deliveryStatus) {
          case 'En Tránsito':
            emailBody = `Hola ${userToNotify.name},\n\nEl estado de tu pedido #${orderIdFormatted} ha sido actualizado a: "En Tránsito".\n\nTu pedido fue despachado y se encuentra en reparto, en cualquier momento lo debes estar recibiendo.\n\nGracias por confiar en FerreCenter.`;
            break;
          case 'Entregado':
            emailBody = `Hola ${userToNotify.name},\n\nEl estado de tu pedido #${orderIdFormatted} ha sido actualizado a: "Entregado".\n\nTu pedido ha sido entregado, muchas gracias por confiar en FerreCenter y elegirnos siempre.`;
            break;
          case 'Cancelado':
            emailBody = `Hola ${userToNotify.name},\n\nEl estado de tu pedido #${orderIdFormatted} ha sido actualizado a: "Cancelado".\n\nEl pedido fue cancelado por solicitud suya, estaremos haciendo el desembolso lo antes posible, por favor responda este correo confirmando el numero de cuenta y titular para el reembolso.`;
            break;
        }

        // Solo enviar el correo si hay un mensaje definido para el estado
        if (emailBody) {
          await transporter.sendMail({
            from: `"FerreCenter" <${process.env.EMAIL_USER}>`,
            to: userToNotify.email,
            subject: `Tu pedido de FerreCenter ha sido actualizado a: ${deliveryStatus}`,
            text: emailBody,
          });
        }
      } catch (error) {
        console.error("Error enviando correo de actualización de estado:", error);
        // No bloquear la respuesta si el correo falla, pero sí registrar el error.
      }
    } else {
      console.log(`No se envió correo para la orden ${order.id} porque el usuario no existe o no tiene email.`);
    }

    res.json({ ...updatedOrder, _id: updatedOrder.id });
  } else {
    res.status(404).json({ message: 'Orden no encontrada' });
  }
});

// Obtener mis órdenes
router.get('/myorders', protect, async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', req.user._id);

    if (error) throw error;

    // MAPEAMOS para que el frontend siga viendo "_id" y no se rompa
    const formattedOrders = data.map(order => ({
      ...order,
      _id: order.id,
      createdAt: order.created_at,
      totalPrice: order.total_price,
      orderItems: order.order_items.map(item => ({
        ...item,
        imageUrl: item.image_url // Mapeo para consistencia
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

// Obtener TODAS las órdenes (Solo Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const { data, error } = await supabase
      .from('orders')
      // Agregamos order_items(*) para que el admin vea los productos
      .select('*, profiles(name, email), order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return res.json([]);

    // Mapeo para compatibilidad
    const formattedOrders = data.map(order => ({
      ...order,
      _id: order.id,
      createdAt: order.created_at,
      totalPrice: order.total_price,
      paymentStatus: order.payment_status,
      deliveryStatus: order.delivery_status,
      user: order.profiles,
      orderItems: order.order_items.map(item => ({
        ...item,
        imageUrl: item.image_url
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('❌ Error en GET /api/orders:', error);
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

const multer = require('multer');

// Middleware de Multer para subir el comprobante
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Archivo no soportado (solo imágenes, PDF, Word)');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Enviar orden con comprobante de pago
router.post('/send-with-proof', protect, upload.single('proof'), async (req, res) => {
  const { orderId } = req.body;
  const supabase = req.app.get('supabase');

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, order_items(*), profiles(*)')
    .eq('id', orderId)
    .single();

  if (!order || fetchError) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }

  if (order.is_paid) {
    return res.status(400).json({ message: 'Esta orden ya fue procesada' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido un comprobante de pago' });
  }

  // Marcar como pagada y descontar stock
  await supabase.from('orders').update({ is_paid: true, paid_at: new Date(), payment_status: 'Pagado' }).eq('id', orderId);

  for (const item of order.order_items) {
    await supabase.rpc('decrement_stock', { row_id: item.product_id, quantity: item.qty });
  }

  // --- Enviar Notificación por Correo ---
  try {
    const user = order.profiles;
    const { data: company } = await supabase.from('company_profile').select('*').single();

    const orderIdFormatted = order.order_id ? `FAC - ${order.order_id.toString().padStart(3, '0')}` : order.id.toString().substring(0, 8);
    const itemsList = order.order_items.map(item => `- ${item.name} (x${item.qty}) - $${item.price.toLocaleString('es-CO')}`).join('\n');
    
    const message = `
      ¡Nueva Orden con Comprobante Adjunto! 📄

      --- Datos del Cliente ---
      Nombre: ${user.name}
      Identificación: ${user.identification || 'No registrada'}
      Teléfono: ${user.phone || 'No registrado'}
      Dirección: ${user.address || 'No registrada'}
      Correo: ${user.email}

      --- Detalles del Pedido ---
      ID Orden: ${orderIdFormatted}
      Total Pagado: $${order.total_price.toLocaleString('es-CO')}
      
      Productos:
      ${itemsList}

      El comprobante de pago se encuentra adjunto a este correo.
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: {
        rejectUnauthorized: false
      }
    });

    // --- GENERAR PDF DE LA FACTURA (NUEVO DISEÑO) ---
    const pdfBuffer = await generateInvoicePDF({ ...order, is_paid: true, order_items: order.order_items }, user, company);

    // --- Enviar Correo al Admin con AMBOS adjuntos ---
    await transporter.sendMail({
      // NOTA: El correo se envía a la dirección especificada aquí.
      // Si no está llegando, verifica las credenciales en tu archivo .env (EMAIL_USER, EMAIL_PASS)
      // y asegúrate de que Gmail no esté bloqueando el inicio de sesión (puedes necesitar una "contraseña de aplicación").
      from: `"Sistema de Ventas" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Se envía al correo de la empresa configurado en .env
      subject: `Nueva Orden con Comprobante - #${orderIdFormatted}`,
      text: message,
      attachments: [
        {
          filename: `Factura-${order.id}.pdf`,
          content: pdfBuffer,
        },
        {
          filename: req.file.originalname,
          // Usar el buffer directamente ya que multer.memoryStorage() está en uso
          content: req.file.buffer,
        },
      ],
    });

    // --- Enviar Correo de Confirmación al Cliente ---
    await transporter.sendMail({
      from: `"FerreCenter" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Confirmación de Pedido - Orden #${orderIdFormatted}`,
      text: `Hola ${user.name},\n\nHemos recibido tu pedido y el comprobante de pago. Lo verificaremos a la brevedad. Adjunto encontrarás la factura de tu pedido.\n\nTotal: $${order.total_price.toLocaleString('es-CO')}\n\nAtentamente,\nEl equipo de FerreCenter`,
      attachments: [
        {
          filename: `Factura-${order.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.json({ message: 'Orden y comprobante enviados correctamente' });

  } catch (error) {
    console.error("Error enviando orden con comprobante:", error);
    res.status(500).json({ message: 'Error procesando la orden' });
  }
});

// Eliminar orden (Solo Admin)
router.delete('/:id', protect, admin, async (req, res) => { // Asegúrate de que esta ruta esté al final o no interferirá con rutas como /myorders
  const supabase = req.app.get('supabase');
  const { error } = await supabase.from('orders').delete().eq('id', req.params.id);

  if (!error) {
    res.json({ message: 'Orden eliminada correctamente' });
  } else {
    res.status(404).json({ message: 'Orden no encontrada' });
  }
});

module.exports = router;
