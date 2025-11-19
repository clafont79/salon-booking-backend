const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Genera JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Registra nuovo utente
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { nome, cognome, email, telefono, password, ruolo } = req.body;

    // Verifica se utente esiste già
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email già registrata' });
    }

    // Crea utente
    const user = await User.create({
      nome,
      cognome,
      email,
      telefono,
      password,
      ruolo: ruolo || 'cliente'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        telefono: user.telefono,
        ruolo: user.ruolo,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    // Verifica utente
    const user = await User.findOne({ email });
    console.log('User found:', user ? user.email : 'NOT FOUND');

    if (user && (await user.matchPassword(password))) {
      console.log('Login successful for:', email);
      res.json({
        _id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        telefono: user.telefono,
        ruolo: user.ruolo,
        token: generateToken(user._id),
      });
    } else {
      console.log('Login failed for:', email, '- password match:', user ? await user.matchPassword(password) : 'N/A');
      res.status(401).json({ message: 'Email o password non validi' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Errore durante il login', error: error.message });
  }
};

// @desc    Ottieni profilo utente corrente
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero del profilo', error: error.message });
  }
};
