require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Operator = require('../models/Operator');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_booking';

const operatorsData = [
  {
    email: 'mario.rossi@salon.com',
    specializzazioni: ['Parrucchiere/a', 'Barbiere'],
    descrizione: 'Esperto in tagli classici e moderni',
    colore: '#667eea',
    disponibilita: [
      {
        giornoSettimana: 'lunedi',
        oraInizio: '09:00',
        oraFine: '18:00',
        pausaPranzo: true,
        inizioPausa: '13:00',
        finePausa: '14:00'
      },
      {
        giornoSettimana: 'martedi',
        oraInizio: '09:00',
        oraFine: '18:00',
        pausaPranzo: true,
        inizioPausa: '13:00',
        finePausa: '14:00'
      },
      {
        giornoSettimana: 'mercoledi',
        oraInizio: '09:00',
        oraFine: '18:00',
        pausaPranzo: true,
        inizioPausa: '13:00',
        finePausa: '14:00'
      },
      {
        giornoSettimana: 'giovedi',
        oraInizio: '09:00',
        oraFine: '18:00',
        pausaPranzo: true,
        inizioPausa: '13:00',
        finePausa: '14:00'
      },
      {
        giornoSettimana: 'venerdi',
        oraInizio: '09:00',
        oraFine: '18:00',
        pausaPranzo: true,
        inizioPausa: '13:00',
        finePausa: '14:00'
      }
    ]
  },
  {
    email: 'laura.bianchi@salon.com',
    specializzazioni: ['Estetista', 'Manicure/Pedicure'],
    descrizione: 'Specializzata in trattamenti viso e mani',
    colore: '#f093fb',
    disponibilita: [
      {
        giornoSettimana: 'lunedi',
        oraInizio: '10:00',
        oraFine: '19:00',
        pausaPranzo: true,
        inizioPausa: '13:30',
        finePausa: '14:30'
      },
      {
        giornoSettimana: 'martedi',
        oraInizio: '10:00',
        oraFine: '19:00',
        pausaPranzo: true,
        inizioPausa: '13:30',
        finePausa: '14:30'
      },
      {
        giornoSettimana: 'mercoledi',
        oraInizio: '10:00',
        oraFine: '19:00',
        pausaPranzo: true,
        inizioPausa: '13:30',
        finePausa: '14:30'
      },
      {
        giornoSettimana: 'giovedi',
        oraInizio: '10:00',
        oraFine: '19:00',
        pausaPranzo: true,
        inizioPausa: '13:30',
        finePausa: '14:30'
      },
      {
        giornoSettimana: 'sabato',
        oraInizio: '09:00',
        oraFine: '17:00',
        pausaPranzo: false
      }
    ]
  },
  {
    email: 'giulia.verdi@salon.com',
    specializzazioni: ['Massaggiatore/trice', 'Estetista'],
    descrizione: 'Massaggi rilassanti e trattamenti corpo',
    colore: '#43e97b',
    disponibilita: [
      {
        giornoSettimana: 'martedi',
        oraInizio: '09:00',
        oraFine: '17:00',
        pausaPranzo: true,
        inizioPausa: '12:30',
        finePausa: '13:30'
      },
      {
        giornoSettimana: 'mercoledi',
        oraInizio: '09:00',
        oraFine: '17:00',
        pausaPranzo: true,
        inizioPausa: '12:30',
        finePausa: '13:30'
      },
      {
        giornoSettimana: 'giovedi',
        oraInizio: '09:00',
        oraFine: '17:00',
        pausaPranzo: true,
        inizioPausa: '12:30',
        finePausa: '13:30'
      },
      {
        giornoSettimana: 'venerdi',
        oraInizio: '09:00',
        oraFine: '17:00',
        pausaPranzo: true,
        inizioPausa: '12:30',
        finePausa: '13:30'
      },
      {
        giornoSettimana: 'sabato',
        oraInizio: '10:00',
        oraFine: '18:00',
        pausaPranzo: false
      }
    ]
  },
  {
    email: 'marco.neri@salon.com',
    specializzazioni: ['Parrucchiere/a', 'Truccatore/trice'],
    descrizione: 'Hair styling e make-up per eventi',
    colore: '#4facfe',
    disponibilita: [
      {
        giornoSettimana: 'lunedi',
        oraInizio: '14:00',
        oraFine: '20:00',
        pausaPranzo: false
      },
      {
        giornoSettimana: 'mercoledi',
        oraInizio: '14:00',
        oraFine: '20:00',
        pausaPranzo: false
      },
      {
        giornoSettimana: 'venerdi',
        oraInizio: '14:00',
        oraFine: '20:00',
        pausaPranzo: false
      },
      {
        giornoSettimana: 'sabato',
        oraInizio: '09:00',
        oraFine: '19:00',
        pausaPranzo: true,
        inizioPausa: '13:00',
        finePausa: '14:00'
      }
    ]
  }
];

async function createOperators() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connesso a MongoDB');

    let created = 0;
    let skipped = 0;

    for (const opData of operatorsData) {
      // Trova l'utente
      const user = await User.findOne({ email: opData.email });
      
      if (!user) {
        console.log(`❌ Utente ${opData.email} non trovato`);
        skipped++;
        continue;
      }

      // Verifica se l'operatore esiste già
      const existingOp = await Operator.findOne({ userId: user._id });
      
      if (existingOp) {
        console.log(`⚠️  Operatore per ${user.nome} ${user.cognome} già esistente, salto...`);
        skipped++;
        continue;
      }

      // Crea l'operatore
      const operator = await Operator.create({
        userId: user._id,
        specializzazioni: opData.specializzazioni,
        descrizione: opData.descrizione,
        colore: opData.colore,
        disponibilita: opData.disponibilita,
        attivo: true
      });

      console.log(`✅ Operatore creato: ${user.nome} ${user.cognome}`);
      console.log(`   Specializzazioni: ${operator.specializzazioni.join(', ')}`);
      console.log(`   Disponibilità: ${operator.disponibilita.length} fasce orarie`);
      created++;
    }

    console.log(`\n📊 Riepilogo:`);
    console.log(`   Operatori creati: ${created}`);
    console.log(`   Operatori saltati: ${skipped}`);

    // Mostra il totale
    const totalOperators = await Operator.countDocuments();
    console.log(`   Totale operatori nel DB: ${totalOperators}`);

    await mongoose.connection.close();
    console.log('\n✅ Operazione completata con successo');
    console.log('Connessione chiusa');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

createOperators();
