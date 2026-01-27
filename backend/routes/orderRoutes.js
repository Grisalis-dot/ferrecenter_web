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

    const order = new Order({
      user: req.user._id,
      orderItems,
      totalPrice,
      isPaid: false, // Ahora inicia como NO pagada
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
        ID Orden: ${order._id}
        Total a Pagar (Consignación): $${totalPrice.toLocaleString('es-CO')}
        
        Productos:
        ${itemsList}
      `;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });

      // --- GENERAR PDF DE LA FACTURA ---
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Promesa para manejar la finalización del PDF
      const pdfPromise = new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);
      });

      // 1. Encabezado de la Empresa
      if (company.logoUrl) {
        // Eliminamos el slash inicial si existe para asegurar que path.join resuelva relativo al proyecto
        const relativeLogoUrl = company.logoUrl.startsWith('/') || company.logoUrl.startsWith('\\') ? company.logoUrl.substring(1) : company.logoUrl;
        const logoPath = path.join(__dirname, '..', relativeLogoUrl);
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 50 });
        }
      }

      doc
        .fillColor('#444444')
        .fontSize(20)
        .text(company.name, 110, 57)
        .fontSize(10)
        .text(company.name, 200, 50, { align: 'right' })
        .text(`NIT: ${company.nit}`, 200, 65, { align: 'right' })
        .text(company.address, 200, 80, { align: 'right' })
        .text(`Tel: ${company.phone}`, 200, 95, { align: 'right' })
        .text(company.email, 200, 110, { align: 'right' })
        .moveDown();

      // 2. Separador
      doc.moveTo(50, 135).lineTo(550, 135).stroke();

      // 3. Información del Cliente y Orden
      doc
        .fontSize(14)
        .text('Factura de Venta', 50, 160)
        .fontSize(10)
        .text(`Orden N°: ${order._id}`, 50, 180)
        .text(`Fecha: ${new Date().toLocaleDateString()}`, 50, 195)
        .text(`Cliente: ${user.name}`, 300, 180, { align: 'right' })
        .text(`CC/NIT: ${user.identification || 'N/A'}`, 300, 195, { align: 'right' })
        .text(`Dirección: ${user.address || 'N/A'}`, 300, 210, { align: 'right' })
        .text(`Teléfono: ${user.phone || 'N/A'}`, 300, 225, { align: 'right' });

      // 4. Tabla de Productos
      let i;
      const invoiceTableTop = 270;

      doc.font("Helvetica-Bold");
      doc.text("Item", 50, invoiceTableTop);
      doc.text("Descripción", 150, invoiceTableTop);
      doc.text("Cant.", 280, invoiceTableTop, { width: 90, align: "right" });
      doc.text("Precio Unit.", 370, invoiceTableTop, { width: 90, align: "right" });
      doc.text("Total", 0, invoiceTableTop, { align: "right" });
      doc.font("Helvetica");

      doc.moveTo(50, invoiceTableTop + 15).lineTo(550, invoiceTableTop + 15).stroke();

      let position = 0;
      orderItems.forEach((item, index) => {
        position = invoiceTableTop + 30 + (index * 30);
        doc.text(index + 1, 50, position);
        doc.text(item.name.substring(0, 30), 150, position);
        doc.text(item.qty, 280, position, { width: 90, align: "right" });
        doc.text("$" + item.price.toLocaleString('es-CO'), 370, position, { width: 90, align: "right" });
        doc.text("$" + item.price.toLocaleString('es-CO'), 0, position, { align: "right" });
      });

      // 5. Total
      const subtotalPosition = position + 30;
      doc.moveTo(50, subtotalPosition).lineTo(550, subtotalPosition).stroke();
      doc.font("Helvetica-Bold");
      doc.text("Total a Pagar:", 370, subtotalPosition + 15, { width: 90, align: "right" });
      doc.text("$" + totalPrice.toLocaleString('es-CO'), 0, subtotalPosition + 15, { align: "right" });

      doc.end();
      const pdfBuffer = await pdfPromise;

      // --- ENVIAR CORREO AL ADMIN ---
      await transporter.sendMail({
        from: `"Sistema de Ventas" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Correo de la empresa
        subject: `Nueva Venta - Orden #${order._id}`,
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
        subject: `Confirmación de Pedido - Orden #${order._id}`,
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

module.exports = router;
