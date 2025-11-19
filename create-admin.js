const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (deve corrispondere al modello User.js)
const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  cognome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  telefono: String,
  password: {
    type: String,
    required: true
  },
  ruolo: {
    type: String,
    enum: ['cliente', 'admin', 'operatore'],
    default: 'cliente'
  },
  attivo: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connessione al database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_booking';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connesso al database MongoDB');

    // Dati utente admin
    const adminData = {
      nome: 'Admin',
      cognome: 'Sistema',
      email: 'admin@salon.com',
      telefono: '1234567890',
      ruolo: 'admin',
      attivo: true
    };

    const password = 'adminSalon2025'; // Password di default
    
    // Verifica se l'admin esiste già e eliminalo
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  L\'utente admin esiste già!');
      console.log('📧 Email:', adminData.email);
      console.log('🔄 Elimino e ricreo l\'utente...');
      await User.deleteOne({ email: adminData.email });
      console.log('✅ Utente precedente eliminato');
    }
    
    // Hash della password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crea nuovo utente admin
    const admin = new User({
      ...adminData,
      password: hashedPassword
    });
    
    await admin.save();
    
    console.log('\n✅ Utente ADMIN creato con successo!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', password);
    console.log('👤 Nome:', adminData.nome, adminData.cognome);
    console.log('📱 Telefono:', adminData.telefono);
    console.log('👑 Ruolo: ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE: Cambia la password dopo il primo accesso!');
    
    // Chiudi connessione
    await mongoose.connection.close();
    console.log('\n✅ Script completato. Connessione chiusa.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

// Esegui lo script
createAdminUser();
