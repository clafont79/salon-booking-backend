require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_booking';

async function resetPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connesso a MongoDB');

    const cliente = await User.findOne({ email: 'cliente@test.com' });
    
    if (!cliente) {
      console.log('❌ Cliente non trovato');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ Cliente trovato:', cliente.email);
    
    // Aggiorna la password (il pre-save middleware la hashera automaticamente)
    cliente.password = 'Password123!';
    await cliente.save();
    
    console.log('✓ Password aggiornata a: Password123!');
    
    // Verifica che la password sia corretta
    const isMatch = await cliente.matchPassword('Password123!');
    console.log('✓ Verifica password:', isMatch ? 'OK ✓' : 'FALLITA ❌');
    
    await mongoose.connection.close();
    console.log('✓ Operazione completata');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

resetPassword();
