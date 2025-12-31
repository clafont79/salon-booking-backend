const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  operatoreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    default: null
  },
  nomeSalone: {
    type: String,
    default: 'Dionisio' // Nome di default per appuntamenti esistenti
  },
  dataOra: {
    type: Date,
    required: true
  },
  durata: {
    type: Number, // in minuti
    required: true,
    default: 30
  },
  servizio: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: String,
    default: ''
  },
  stato: {
    type: String,
    enum: ['confermato', 'completato', 'cancellato', 'in-attesa'],
    default: 'confermato'
  },
  prezzo: {
    type: Number,
    default: 0
  },
  metodoPagamento: {
    type: String,
    enum: ['contanti', 'carta', 'paypal', 'google-pay', 'non-pagato'],
    default: 'non-pagato'
  },
  pagato: {
    type: Boolean,
    default: false
  },
  transazioneId: {
    type: String,
    default: null
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

// Index per ottimizzare query su data e operatore
appointmentSchema.index({ dataOra: 1, operatoreId: 1 });
appointmentSchema.index({ clienteId: 1, dataOra: -1 });

// Aggiorna updatedAt automaticamente
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
