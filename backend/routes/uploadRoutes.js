const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // Nombre único: nombreoriginal-fecha.extensión
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Filtro para validar que sea imagen
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: ¡Solo imágenes!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// La ruta POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  // Devolvemos la ruta donde quedó guardada la imagen
  // Reemplazamos backslashes de Windows por slashes normales
  res.send(`/${req.file.path.replace(/\\/g, '/')}`);
});

module.exports = router;