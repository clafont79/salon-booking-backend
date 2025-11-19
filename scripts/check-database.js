const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/salon_booking';

async function checkDatabase() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connesso a MongoDB');

    // Mostra tutte le collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== COLLECTIONS NEL DATABASE ===');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Conta documenti in ogni collection
    console.log('\n=== CONTEGGIO DOCUMENTI ===');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documenti`);
    }

    // Mostra gli utenti
    const User = require('../models/User');
    const users = await User.find({}).select('nome cognome email ruolo attivo');
    console.log('\n=== UTENTI NEL DATABASE ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} ${user.cognome} (${user.email})`);
      console.log(`   Ruolo: ${user.ruolo} | Attivo: ${user.attivo ? 'Sì' : 'No'}`);
    });

    // Mostra gli operatori
    const Operator = require('../models/Operator');
    const operators = await Operator.find({}).populate('userId', 'nome cognome email');
    console.log('\n=== OPERATORI NEL DATABASE ===');
    if (operators.length === 0) {
      console.log('Nessun operatore trovato!');
    } else {
      operators.forEach((op, index) => {
        console.log(`${index + 1}. ${op.userId.nome} ${op.userId.cognome}`);
        console.log(`   Specializzazioni: ${op.specializzazioni.join(', ')}`);
        console.log(`   Disponibilità: ${op.disponibilita.length} fasce orarie`);
      });
    }

    await mongoose.connection.close();
    console.log('\nConnessione chiusa');
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

checkDatabase();
