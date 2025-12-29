const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['appuntamento_imminente', 'appuntamento_confermato', 'appuntamento_cancellato', 'promemoria_24h', 'promemoria_1h', 'altro']
  },
  titolo: {
    type: String,
    required: true
  },
  messaggio: {
    type: String,
    required: true
  },
  appuntamentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  letto: {
    type: Boolean,
    default: false
  },
  dataInvio: {
    type: Date,
    default: Date.now
  }
});

// Indice per performance query
notificationSchema.index({ userId: 1, letto: 1, dataInvio: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
