const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  identification: { type: String, required: true },
  department: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);