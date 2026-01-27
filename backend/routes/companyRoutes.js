const express = require('express');
const router = express.Router();
const CompanyProfile = require('../models/CompanyProfile');
const { protect, admin } = require('../middleware/authMiddleware');

// Obtener perfil de la empresa
router.get('/', async (req, res) => {
  let profile = await CompanyProfile.findOne();
  if (!profile) {
    profile = await CompanyProfile.create({});
  }
  res.json(profile);
});

// Actualizar perfil (Solo Admin)
router.post('/', protect, admin, async (req, res) => {
  const { name, nit, address, phone, email, logoUrl } = req.body;
  let profile = await CompanyProfile.findOne();

  if (profile) {
    profile.name = name || profile.name;
    profile.nit = nit || profile.nit;
    profile.address = address || profile.address;
    profile.phone = phone || profile.phone;
    profile.email = email || profile.email;
    profile.logoUrl = logoUrl || profile.logoUrl;
    const updatedProfile = await profile.save();
    res.json(updatedProfile);
  } else {
    const newProfile = await CompanyProfile.create({ name, nit, address, phone, email, logoUrl });
    res.json(newProfile);
  }
});

module.exports = router;