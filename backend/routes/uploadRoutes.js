const express = require('express');
const multer = require('multer');
const router = express.Router();

// Usamos almacenamiento en memoria para procesar la subida a Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload - Sube la imagen a Supabase Storage
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const file = req.file;

    if (!file) {
      return res.status(400).send('No se ha subido ninguna imagen');
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    
    // Subir al bucket 'ferrecenter-images' que creamos antes
    const { data, error } = await supabase.storage
      .from('ferrecenter-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // Obtener URL pública de la imagen
    const { data: publicUrlData } = supabase.storage
      .from('ferrecenter-images')
      .getPublicUrl(fileName);

    res.send(publicUrlData.publicUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;