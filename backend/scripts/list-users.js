require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_booking';

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connesso a MongoDB');

    const users = await User.find({}).select('nome cognome email ruolo attivo');
    
    console.log(`\nTotale utenti: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} ${user.cognome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Ruolo: ${user.ruolo}`);
      console.log(`   Attivo: ${user.attivo ? 'Sì' : 'No'}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('Connessione chiusa');
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

listUsers();
