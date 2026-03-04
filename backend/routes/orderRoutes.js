const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const CompanyProfile = require('../models/CompanyProfile');

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
  if (company.logoUrl) {
    const relativeLogoUrl = company.logoUrl.startsWith('/') || company.logoUrl.startsWith('\\') ? company.logoUrl.substring(1) : company.logoUrl;
    const logoPath = path.join(__dirname, '..', relativeLogoUrl);
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 80 });
    }
  }
  doc
    .fillColor(fontColor)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(company.name || 'FerreCenter', 200, 50, { align: 'right' })
    .fontSize(10)
    .font('Helvetica')
    .text(`NIT: ${company.nit || 'N/A'}`, 200, 70, { align: 'right' })
    .text(company.address || 'Dirección no disponible', 200, 85, { align: 'right' })
    .text(`${company.phone || 'Teléfono no disponible'}`, 200, 100, { align: 'right' })
    .text(company.email || 'email@example.com', 200, 115, { align: 'right' });

  // --- Título y Datos de Factura ---
  doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('FACTURA', 50, 160);
  doc.strokeColor(primaryColor).lineWidth(1).moveTo(50, 185).lineTo(550, 185).stroke();
  const invoiceNumber = order.orderId ? `FAC - ${order.orderId.toString().padStart(3, '0')}` : `REF - ${order._id.toString().substring(0, 8)}`;
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
  order.orderItems.forEach((item, i) => {
    y += 30;
    const subtotal = item.qty * item.price;
    doc.fontSize(10).text(i + 1, itemCol, y);
    doc.text(item.name, descCol, y, { width: 180 });
    doc.text(item.qty, qtyCol, y, { width: 60, align: 'right' });
    doc.text(`$${item.price.toLocaleString('es-CO')}`, priceCol, y, { width: 90, align: 'right' });
    doc.text(`$${subtotal.toLocaleString('es-CO')}`, totalCol, y, { width: 100, align: 'right' });
    if (i < order.orderItems.length - 1) doc.moveTo(itemCol, y + 20).lineTo(550, y + 20).strokeColor('#eeeeee').stroke();
  });

  // --- Total General y Mensaje Final ---
  const totalY = y + 40;
  doc.strokeColor('#cccccc').moveTo(350, totalY).lineTo(550, totalY).stroke();
  doc.font('Helvetica-Bold').fontSize(12).text('Total General:', 350, totalY + 10, { align: 'left' }).text(`$${order.totalPrice.toLocaleString('es-CO')}`, 0, totalY + 10, { align: 'right' });
  doc.strokeColor('#cccccc').moveTo(350, totalY + 30).lineTo(550, totalY + 30).stroke();
  doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('¡Gracias por su compra!', 50, doc.page.height - 100, { align: 'center', width: 500 });

  doc.end();
  return pdfPromise;
}

// Crear nueva orden
router.post('/', protect, async (req, res) => {
  const { orderItems, totalPrice } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No hay ítems en la orden' });
    return;
  } else {
    // --- VALIDACIÓN DE STOCK ANTES DE CREAR LA ORDEN ---
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado: ${item.name}` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ message: `Stock insuficiente para: ${item.name}. Disponible: ${product.stock}` });
      }
    }

    // Calcular el siguiente consecutivo (orderId)
    const lastOrder = await Order.findOne().sort({ orderId: -1 });
    const nextId = (lastOrder && lastOrder.orderId) ? lastOrder.orderId + 1 : 1;

    const order = new Order({
      user: req.user._id,
      orderItems,
      totalPrice,
      isPaid: false, // Ahora inicia como NO pagada
      paymentStatus: 'Pendiente',
      deliveryStatus: 'Pendiente',
      orderId: nextId,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});

// Confirmar pago de orden (Llamado tras éxito en Wompi)
router.put('/:id/pay', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // --- EVITAR DOBLE PROCESAMIENTO ---
    if (order.isPaid) {
      return res.json(order); // Si ya estaba pagada, no hacemos nada más
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'Pagado';

    // --- DESCONTAR STOCK DEL INVENTARIO ---
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock = product.stock - item.qty;
        await product.save();
      }
    }

    const updatedOrder = await order.save();
    
    const { orderItems, totalPrice } = order;

    // --- Enviar Notificación de Compra al Admin ---
    try {
      const user = req.user; // El middleware 'protect' ya nos da el usuario completo
      const company = await CompanyProfile.findOne() || { name: 'FerreCenter', nit: '900.000.000-1', address: 'Barranquilla', phone: '', email: '' };
      
      const orderIdFormatted = order.orderId ? `FAC - ${order.orderId.toString().padStart(3, '0')}` : order._id.toString().substring(0, 8);
      const itemsList = orderItems.map(item => `- ${item.name} (x${item.qty}) - $${item.price.toLocaleString('es-CO')}`).join('\n');
      
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
        Total a Pagar (Consignación): $${totalPrice.toLocaleString('es-CO')}
        
        Productos:
        ${itemsList}
      `;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      // --- GENERAR PDF DE LA FACTURA (NUEVO DISEÑO) ---
      const pdfBuffer = await generateInvoicePDF(updatedOrder, user, company);

      // --- ENVIAR CORREO AL ADMIN ---
      await transporter.sendMail({
        from: `"Sistema de Ventas" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Correo de la empresa
        subject: `Nueva Venta - Orden #${orderIdFormatted}`,
        text: message,
        attachments: [
          {
            filename: `Factura-${order._id}.pdf`,
            content: pdfBuffer
          }
        ]
      });

      // --- ENVIAR CORREO AL CLIENTE ---
      await transporter.sendMail({
        from: `"FerreCenter" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Confirmación de Pedido - Orden #${orderIdFormatted}`,
        text: `Hola ${user.name},\n\nGracias por tu compra en FerreCenter. Adjunto encontrarás la factura de tu pedido.\n\nTotal: $${totalPrice.toLocaleString('es-CO')}\n\nAtentamente,\nEl equipo de FerreCenter`,
        attachments: [
          {
            filename: `Factura-${order._id}.pdf`,
            content: pdfBuffer
          }
        ]
      });
    } catch (error) {
      console.error("Error enviando correo de notificación de venta:", error);
      // No detenemos la respuesta si falla el correo, la orden ya se creó
    }

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Orden no encontrada' });
  }
});

// Actualizar estado de entrega de una orden (Solo Admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    const { deliveryStatus } = req.body;
    const userToNotify = order.user; // Guardar la información del usuario antes de que se pierda al guardar.

    // Validar que el estado sea uno de los permitidos
    if (!['Pendiente', 'En Tránsito', 'Entregado', 'Cancelado'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Estado de entrega no válido.' });
    }

    order.deliveryStatus = deliveryStatus;

    // Si se marca como 'Entregado', actualizamos los campos correspondientes
    if (deliveryStatus === 'Entregado') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // --- LÓGICA ADICIONAL ---
    // Si el pedido se marca como "En Tránsito" o "Entregado",
    // y el pago aún estaba "Pendiente", lo actualizamos a "Pagado".
    // Esto asume que el admin ha verificado el pago antes de despachar.
    if ((deliveryStatus === 'En Tránsito' || deliveryStatus === 'Entregado') && order.paymentStatus === 'Pendiente') {
      order.paymentStatus = 'Pagado';
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();

    // --- NOTIFICAR AL CLIENTE POR CORREO ---
    // Se verifica que el usuario de la orden exista antes de intentar enviar el correo.
    // Usamos la variable 'userToNotify' que guardamos antes del .save()
    if (userToNotify && userToNotify.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const orderIdFormatted = order.orderId ? `FAC - ${order.orderId.toString().padStart(3, '0')}` : order._id.toString().substring(0, 8);
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
      console.log(`No se envió correo para la orden ${order._id} porque el usuario no existe o no tiene email.`);
    }

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Orden no encontrada' });
  }
});

// Obtener mis órdenes
router.get('/myorders', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// Obtener TODAS las órdenes (Solo Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

const multer = require('multer');

// Middleware de Multer para subir el comprobante
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `comprobante-${Date.now()}${path.extname(file.originalname)}`);
  },
});

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
  const order = await Order.findById(orderId).populate('user', 'name email identification phone address');

  if (!order) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }

  if (order.isPaid) {
    return res.status(400).json({ message: 'Esta orden ya fue procesada' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido un comprobante de pago' });
  }

  // Marcar como pagada y descontar stock
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentStatus = 'Pagado'; // El comprobante se ha subido, se marca como 'Pagado' para revisión

  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock -= item.qty;
      await product.save();
    }
  }

  await order.save();

  // --- Enviar Notificación por Correo ---
  try {
    const user = order.user;
    const company = await CompanyProfile.findOne() || { name: 'FerreCenter', nit: '900.000.000-1', address: 'Barranquilla', phone: '', email: 'servicios.ferrecenter@gmail.com' };

    const orderIdFormatted = order.orderId ? `FAC - ${order.orderId.toString().padStart(3, '0')}` : order._id.toString().substring(0, 8);
    const itemsList = order.orderItems.map(item => `- ${item.name} (x${item.qty}) - $${item.price.toLocaleString('es-CO')}`).join('\n');
    
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
      Total Pagado: $${order.totalPrice.toLocaleString('es-CO')}
      
      Productos:
      ${itemsList}

      El comprobante de pago se encuentra adjunto a este correo.
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // --- GENERAR PDF DE LA FACTURA (NUEVO DISEÑO) ---
    const pdfBuffer = await generateInvoicePDF(order, user, company);

    // --- Enviar Correo al Admin con AMBOS adjuntos ---
    await transporter.sendMail({
      // NOTA: El correo se envía a la dirección especificada aquí.
      // Si no está llegando, verifica las credenciales en tu archivo .env (EMAIL_USER, EMAIL_PASS)
      // y asegúrate de que Gmail no esté bloqueando el inicio de sesión (puedes necesitar una "contraseña de aplicación").
      from: `"Sistema de Ventas" <${process.env.EMAIL_USER}>`,
      to: 'servicios.ferrecenter@gmail.com', // Correo del cliente final
      subject: `Nueva Orden con Comprobante - #${orderIdFormatted}`,
      text: message,
      attachments: [
        {
          filename: `Factura-${order._id}.pdf`,
          content: pdfBuffer,
        },
        {
          filename: req.file.originalname,
          path: req.file.path,
        },
      ],
    });

    // --- Enviar Correo de Confirmación al Cliente ---
    await transporter.sendMail({
      from: `"FerreCenter" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Confirmación de Pedido - Orden #${orderIdFormatted}`,
      text: `Hola ${user.name},\n\nHemos recibido tu pedido y el comprobante de pago. Lo verificaremos a la brevedad. Adjunto encontrarás la factura de tu pedido.\n\nTotal: $${order.totalPrice.toLocaleString('es-CO')}\n\nAtentamente,\nEl equipo de FerreCenter`,
      attachments: [
        {
          filename: `Factura-${order._id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Opcional: eliminar el archivo subido después de enviarlo
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Orden y comprobante enviados correctamente' });

  } catch (error) {
    console.error("Error enviando orden con comprobante:", error);
    res.status(500).json({ message: 'Error procesando la orden' });
  }
});

// Eliminar orden (Solo Admin)
router.delete('/:id', protect, admin, async (req, res) => { // Asegúrate de que esta ruta esté al final o no interferirá con rutas como /myorders
  const order = await Order.findById(req.params.id);

  if (order) {
    await order.deleteOne();
    res.json({ message: 'Orden eliminada correctamente' });
  } else {
    res.status(404).json({ message: 'Orden no encontrada' });
  }
});

module.exports = router;
