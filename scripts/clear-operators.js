const mongoose = require('mongoose');

// Connessione a MongoDB
mongoose.connect('mongodb://localhost:27017/salon_booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Errore connessione MongoDB:'));
db.once('open', async () => {
  console.log('Connesso a MongoDB');
  
  try {
    // Elimina tutti gli operatori
    const result = await db.collection('operators').deleteMany({});
    console.log(`Eliminati ${result.deletedCount} operatori`);
    
    console.log('Operazione completata con successo');
  } catch (error) {
    console.error('Errore durante l\'eliminazione:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connessione chiusa');
  }
});
