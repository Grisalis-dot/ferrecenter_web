const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  identification: { type: String, required: true },
  imageUrl: { type: String },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Método para comparar contraseñas ingresadas con la encriptada
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Antes de guardar el usuario, encriptamos la contraseña
userSchema.pre('save', async function () {
  // Si la contraseña no se modificó, continuamos sin hacer nada
  if (!this.isModified('password')) {
    return;
  }
  // Generar "sal" y encriptar
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Generar y hashear token de restablecimiento de contraseña
userSchema.methods.getResetPasswordToken = function () {
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hashear token y guardarlo en el modelo
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Establecer tiempo de expiración (15 minutos)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;