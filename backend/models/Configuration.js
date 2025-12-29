const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  chiave: {
    type: String,
    required: true,
    unique: true
  },
  valore: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  descrizione: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Configurazioni predefinite
configurationSchema.statics.getDefaultConfig = function() {
  return {
    intervalloPrenotazione: {
      chiave: 'intervalloPrenotazione',
      valore: 30, // minuti
      descrizione: 'Durata slot prenotazione in minuti'
    },
    orarioApertura: {
      chiave: 'orarioApertura',
      valore: '09:00',
      descrizione: 'Orario apertura salone'
    },
    orarioChiusura: {
      chiave: 'orarioChiusura',
      valore: '19:00',
      descrizione: 'Orario chiusura salone'
    },
    giorniLavorativi: {
      chiave: 'giorniLavorativi',
      valore: [1, 2, 3, 4, 5, 6], // Lunedì-Sabato
      descrizione: 'Giorni lavorativi (0=Dom, 1=Lun, ..., 6=Sab)'
    },
    anticipoPrenotazione: {
      chiave: 'anticipoPrenotazione',
      valore: 60, // minuti
      descrizione: 'Anticipo minimo per prenotazione in minuti'
    },
    maxPrenotazioniFuture: {
      chiave: 'maxPrenotazioniFuture',
      valore: 30, // giorni
      descrizione: 'Numero massimo giorni nel futuro per prenotazioni'
    }
  };
};

module.exports = mongoose.model('Configuration', configurationSchema);
