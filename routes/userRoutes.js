const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET tutti gli utenti
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Escludi la password
      .sort({ cognome: 1, nome: 1 });
    res.json(users);
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    res.status(500).json({ message: 'Errore nel recupero degli utenti' });
  }
});

// GET utente per ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    console.error('Errore nel recupero dell\'utente:', error);
    res.status(500).json({ message: 'Errore nel recupero dell\'utente' });
  }
});

module.exports = router;
