require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_booking';

const newUsers = [
  {
    nome: 'Admin',
    cognome: 'Sistema',
    email: 'admin@salon.com',
    telefono: '3331111111',
    password: 'adminSalon2025',
    ruolo: 'admin',
    attivo: true
  },
  {
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario.rossi@salon.com',
    telefono: '3331234567',
    password: 'Password123!',
    ruolo: 'operatore',
    attivo: true
  },
  {
    nome: 'Laura',
    cognome: 'Bianchi',
    email: 'laura.bianchi@salon.com',
    telefono: '3337654321',
    password: 'Password123!',
    ruolo: 'operatore',
    attivo: true
  },
  {
    nome: 'Giulia',
    cognome: 'Verdi',
    email: 'giulia.verdi@salon.com',
    telefono: '3339876543',
    password: 'Password123!',
    ruolo: 'operatore',
    attivo: true
  },
  {
    nome: 'Marco',
    cognome: 'Neri',
    email: 'marco.neri@salon.com',
    telefono: '3335554321',
    password: 'Password123!',
    ruolo: 'operatore',
    attivo: true
  },
  {
    nome: 'Cliente',
    cognome: 'Prova',
    email: 'cliente@test.com',
    telefono: '3339999999',
    password: 'Password123!',
    ruolo: 'cliente',
    attivo: true
  }
];

async function addUsers() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connesso a MongoDB');

    for (const userData of newUsers) {
      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`Utente ${userData.email} già esistente, salto...`);
        continue;
      }

      // Crea l'utente (la password verrà hashata automaticamente dal middleware pre-save del model)
      const user = await User.create(userData);
      console.log(`✅ Utente creato: ${user.nome} ${user.cognome} (${user.email})`);
    }

    console.log('\nOperazione completata con successo');
    await mongoose.connection.close();
    console.log('Connessione chiusa');
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

addUsers();
