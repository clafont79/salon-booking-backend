// Script per aggiornare tutti gli appuntamenti esistenti con nome salone "Dionisio"
require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

const updateAppointmentsWithSalon = async () => {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Aggiorna tutti gli appuntamenti senza nomeSalone
    const result = await Appointment.updateMany(
      { nomeSalone: { $exists: false } },
      { 
        $set: { 
          nomeSalone: 'Dionisio',
          metodoPagamento: 'non-pagato',
          pagato: false
        } 
      }
    );

    console.log(`✅ Aggiornati ${result.modifiedCount} appuntamenti con salone "Dionisio"`);

    // Aggiorna appuntamenti con nomeSalone null o vuoto
    const result2 = await Appointment.updateMany(
      { $or: [{ nomeSalone: null }, { nomeSalone: '' }] },
      { 
        $set: { 
          nomeSalone: 'Dionisio' 
        } 
      }
    );

    console.log(`✅ Aggiornati ulteriori ${result2.modifiedCount} appuntamenti`);

    // Mostra alcuni appuntamenti aggiornati
    const samples = await Appointment.find({ nomeSalone: 'Dionisio' }).limit(5);
    console.log('\n📋 Esempi di appuntamenti aggiornati:');
    samples.forEach(app => {
      console.log(`  - ${app.servizio} il ${app.dataOra} presso ${app.nomeSalone}`);
    });

    await mongoose.disconnect();
    console.log('\n✨ Operazione completata con successo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

updateAppointmentsWithSalon();
