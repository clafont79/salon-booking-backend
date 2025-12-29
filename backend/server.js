require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/database');
const notificationController = require('./controllers/notificationController');

// Importa routes
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const configRoutes = require('./routes/configRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware per debug mobile
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('it-IT');
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  if (req.path.includes('/login')) {
    console.log('  Body:', JSON.stringify(req.body));
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/config', configRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Route di test
app.get('/', (req, res) => {
  res.json({ message: 'API Salon Booking funzionante!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Errore del server', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

const PORT = process.env.PORT || 3000;

// Connetti al database
connectDB();

// Avvia il server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server avviato sulla porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API disponibile su:`);
  console.log(`  - Locale: http://localhost:${PORT}`);
  console.log(`  - Rete locale: http://192.168.1.6:${PORT}`);
  console.log(`  - Mobile: Usa http://192.168.1.6:${PORT}/api`);
  
  // Avvia cron job per notifiche ogni 15 minuti
  cron.schedule('*/15 * * * *', () => {
    console.log('Esecuzione controllo appuntamenti imminenti...');
    notificationController.checkUpcomingAppointments();
  });
  console.log('Cron job notifiche attivato (ogni 15 minuti)');
});

server.on('error', (error) => {
  console.error('Errore server:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`La porta ${PORT} è già in uso`);
  }
});

// Gestione eventi processo per debugging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
