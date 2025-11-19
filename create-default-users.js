require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_booking';

const defaultUsers = [
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
    nome: 'Giuseppe',
    cognome: 'Verdi',
    email: 'giuseppe.verdi@salon.com',
    telefono: '3339876543',
    password: 'Password123!',
    ruolo: 'cliente',
    attivo: true
  }
];

async function createDefaultUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connesso a MongoDB');

    for (const userData of defaultUsers) {
      // Verifica se l'utente esiste già
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`Utente ${userData.email} già esistente, lo aggiorno...`);
        await User.deleteOne({ email: userData.email });
      }

      // Hash della password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Crea nuovo utente
      const newUser = new User({
        nome: userData.nome,
        cognome: userData.cognome,
        email: userData.email,
        telefono: userData.telefono,
        password: hashedPassword,
        ruolo: userData.ruolo,
        attivo: userData.attivo
      });

      await newUser.save();
      console.log(`✅ Utente ${userData.nome} ${userData.cognome} (${userData.ruolo}) creato con successo!`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
    }

    console.log('\n📋 Riepilogo Utenti Creati:');
    console.log('================================');
    defaultUsers.forEach(user => {
      console.log(`${user.nome} ${user.cognome} (${user.ruolo})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('Disconnesso da MongoDB');
  } catch (error) {
    console.error('Errore durante la creazione degli utenti:', error);
    process.exit(1);
  }
}

createDefaultUsers();
