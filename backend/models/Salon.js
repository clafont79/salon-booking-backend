const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  indirizzo: {
    type: String,
    required: true,
    trim: true
  },
  citta: {
    type: String,
    required: true,
    trim: true
  },
  cap: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  proprietarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['parrucchiere', 'barbiere', 'centro_estetico', 'altro'],
    default: 'parrucchiere'
  },
  coordinate: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  servizi: [{
    type: String,
    trim: true
  }],
  descrizione: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  orari: {
    lunedi: { type: String, default: '9:00-19:00' },
    martedi: { type: String, default: '9:00-19:00' },
    mercoledi: { type: String, default: '9:00-19:00' },
    giovedi: { type: String, default: '9:00-19:00' },
    venerdi: { type: String, default: '9:00-19:00' },
    sabato: { type: String, default: '9:00-18:00' },
    domenica: { type: String, default: 'Chiuso' }
  },
  immagini: [{
    type: String // URL delle immagini
  }],
  valutazione: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  numeroRecensioni: {
    type: Number,
    default: 0
  },
  attivo: {
    type: Boolean,
    default: true
  },
  verificato: {
    type: Boolean,
    default: false
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

// Index per ricerca geografica
salonSchema.index({ 'coordinate.lat': 1, 'coordinate.lng': 1 });
salonSchema.index({ citta: 1, attivo: 1 });
salonSchema.index({ proprietarioId: 1 });

// Aggiorna updatedAt automaticamente
salonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Salon', salonSchema);
