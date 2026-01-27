const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'FerreCenter' },
  nit: { type: String, required: true, default: '900.000.000-1' },
  address: { type: String, required: true, default: 'Dirección Principal' },
  phone: { type: String, required: true, default: '3000000000' },
  email: { type: String, required: true, default: 'contacto@ferrecenter.com' },
  logoUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);