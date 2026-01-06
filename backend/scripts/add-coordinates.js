/**
 * Script per aggiungere coordinate ai saloni esistenti
 * Uso: node scripts/add-coordinates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Salon = require('../models/Salon');

// Coordinate di esempio per Milano e dintorni
const sampleCoordinates = [
  { lat: 45.4642, lng: 9.1900 },   // Milano centro
  { lat: 45.4698, lng: 9.1898 },   // Milano nord
  { lat: 45.4586, lng: 9.1896 },   // Milano sud
  { lat: 45.4654, lng: 9.2054 },   // Milano est
  { lat: 45.4632, lng: 9.1746 },   // Milano ovest
  { lat: 45.4777, lng: 9.1781 },   // Stazione Centrale
  { lat: 45.4654, lng: 9.1859 },   // Duomo
  { lat: 45.4707, lng: 9.1903 },   // Porta Garibaldi
];

async function addCoordinates() {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connesso al database');

    // Trova tutti i saloni
    const salons = await Salon.find();
    console.log(`📍 Trovati ${salons.length} saloni`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < salons.length; i++) {
      const salon = salons[i];
      
      // Se il salone non ha coordinate, aggiungile
      if (!salon.coordinate || !salon.coordinate.lat || !salon.coordinate.lng) {
        // Usa una coordinata casuale dal set di esempio
        const coords = sampleCoordinates[i % sampleCoordinates.length];
        
        // Aggiungi un piccolo offset casuale per evitare sovrapposizioni
        const randomOffset = () => (Math.random() - 0.5) * 0.01; // ~500m max
        
        salon.coordinate = {
          lat: coords.lat + randomOffset(),
          lng: coords.lng + randomOffset()
        };
        
        await salon.save();
        console.log(`✅ Aggiornato ${salon.nome} con coordinate: ${salon.coordinate.lat.toFixed(4)}, ${salon.coordinate.lng.toFixed(4)}`);
        updated++;
      } else {
        console.log(`⏭️  ${salon.nome} ha già coordinate`);
        skipped++;
      }
    }

    console.log('\n📊 Riepilogo:');
    console.log(`   - Saloni aggiornati: ${updated}`);
    console.log(`   - Saloni saltati: ${skipped}`);
    console.log(`   - Totale: ${salons.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui lo script
addCoordinates();
