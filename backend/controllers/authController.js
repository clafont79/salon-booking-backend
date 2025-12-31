const User = require('../models/User');
const Salon = require('../models/Salon');
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
    const { nome, cognome, email, telefono, password, ruolo, tipoUtente, 
            nomeSalone, indirizzoSalone, cittaSalone, capSalone, tipoSalone } = req.body;

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
      ruolo: tipoUtente === 'esercente' ? 'esercente' : (ruolo || 'cliente'),
      tipoUtente: tipoUtente || 'cliente'
    });

    // Se è un esercente, crea anche il salone
    if (tipoUtente === 'esercente' && nomeSalone) {
      const salon = await Salon.create({
        nome: nomeSalone,
        indirizzo: indirizzoSalone,
        citta: cittaSalone,
        cap: capSalone,
        telefono: telefono,
        email: email,
        proprietarioId: user._id,
        tipo: tipoSalone || 'parrucchiere',
        coordinate: {
          lat: 45.4642, // Coordinate default (Milano) - da aggiornare con geocoding
          lng: 9.1900
        }
      });

      // Aggiorna user con riferimento al salone
      user.salonId = salon._id;
      await user.save();
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        telefono: user.telefono,
        ruolo: user.ruolo,
        tipoUtente: user.tipoUtente,
        salonId: user.salonId,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
  }
};

// @desc    Registra utente con Google
// @route   POST /api/auth/google-register
// @access  Public
exports.googleRegister = async (req, res) => {
  try {
    const { email, nome, cognome, telefono, googleId, photoUrl } = req.body;

    // Verifica se utente esiste già
    let user = await User.findOne({ email });
    
    if (user) {
      // Se l'utente esiste, aggiorna il googleId se non presente
      if (!user.googleId) {
        user.googleId = googleId;
        if (photoUrl) user.photoUrl = photoUrl;
        await user.save();
      }
    } else {
      // Crea nuovo utente
      user = await User.create({
        nome,
        cognome,
        email,
        telefono: telefono || '',
        googleId,
        photoUrl,
        ruolo: 'cliente',
        // Password random per utenti Google (non verrà mai usata)
        password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)
      });
    }

    res.status(200).json({
      _id: user._id,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      telefono: user.telefono,
      ruolo: user.ruolo,
      photoUrl: user.photoUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google register error:', error);
    res.status(500).json({ message: 'Errore durante la registrazione con Google', error: error.message });
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
