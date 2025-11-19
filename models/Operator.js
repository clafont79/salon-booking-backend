const mongoose = require('mongoose');

const disponibilitaSchema = new mongoose.Schema({
  giornoSettimana: {
    type: String, // lunedi, martedi, mercoledi, giovedi, venerdi, sabato, domenica
    required: true,
    enum: ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica']
  },
  oraInizio: {
    type: String, // Formato "HH:mm" es: "09:00"
    required: true
  },
  oraFine: {
    type: String, // Formato "HH:mm" es: "18:00"
    required: true
  },
  pausaPranzo: {
    type: Boolean,
    default: false
  },
  inizioPausa: {
    type: String, // Formato "HH:mm" es: "13:00"
    default: null
  },
  finePausa: {
    type: String, // Formato "HH:mm" es: "14:00"
    default: null
  }
});

const operatorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Un utente può essere operatore una sola volta
  },
  specializzazioni: [{
    type: String,
    required: true,
    trim: true
  }],
  descrizione: {
    type: String,
    default: ''
  },
  colore: {
    type: String,
    default: '#3880ff' // Colore per visualizzazione calendario
  },
  disponibilita: [disponibilitaSchema],
  attivo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Operator', operatorSchema);
