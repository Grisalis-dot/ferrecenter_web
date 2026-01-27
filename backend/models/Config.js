const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // Ej: 'logo'
  value: { type: String, required: true }, // Ej: '/uploads/logo-123.png'
});

module.exports = mongoose.model('Config', configSchema);