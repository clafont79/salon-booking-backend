const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  cognome: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  ruolo: {
    type: String,
    enum: ['cliente', 'admin', 'operatore'],
    default: 'cliente'
  },
  attivo: {
    type: Boolean,
    default: true
  },
  // Campi profilo personale
  fotoProfilo: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  dataNascita: {
    type: Date,
    default: null
  },
  indirizzo: {
    via: { type: String, default: '' },
    citta: { type: String, default: '' },
    cap: { type: String, default: '' },
    provincia: { type: String, default: '' }
  },
  preferenze: {
    notificheEmail: { type: Boolean, default: true },
    notificheSMS: { type: Boolean, default: false },
    linguaPreferita: { type: String, default: 'it' }
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password prima del salvataggio
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metodo per verificare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
