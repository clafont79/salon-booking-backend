const Salon = require('../models/Salon');
const User = require('../models/User');

// @desc    Crea un nuovo salone
// @route   POST /api/salons
// @access  Private (solo esercenti)
exports.createSalon = async (req, res) => {
  try {
    const { nome, indirizzo, citta, cap, telefono, email, tipo, coordinate, servizi, descrizione, orari } = req.body;
    
    // Verifica che l'utente sia un esercente
    const user = await User.findById(req.user._id);
    if (user.tipoUtente !== 'esercente') {
      return res.status(403).json({ message: 'Solo gli esercenti possono creare saloni' });
    }

    // Verifica se l'utente ha già un salone
    const existingSalon = await Salon.findOne({ proprietarioId: req.user._id });
    if (existingSalon) {
      return res.status(400).json({ message: 'Hai già un salone registrato' });
    }

    const salon = await Salon.create({
      nome,
      indirizzo,
      citta,
      cap,
      telefono,
      email,
      proprietarioId: req.user._id,
      tipo,
      coordinate,
      servizi,
      descrizione,
      orari
    });

    // Aggiorna l'utente con il riferimento al salone
    await User.findByIdAndUpdate(req.user._id, { 
      salonId: salon._id,
      ruolo: 'esercente'
    });

    res.status(201).json(salon);
  } catch (error) {
    console.error('Errore creazione salone:', error);
    res.status(500).json({ message: 'Errore durante la creazione del salone' });
  }
};

// @desc    Ottieni tutti i saloni
// @route   GET /api/salons
// @access  Public
exports.getAllSalons = async (req, res) => {
  try {
    const salons = await Salon.find({ attivo: true })
      .populate('proprietarioId', 'nome cognome email telefono')
      .sort({ valutazione: -1 });
    res.json(salons);
  } catch (error) {
    console.error('Errore recupero saloni:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei saloni' });
  }
};

// @desc    Ottieni saloni vicini
// @route   GET /api/salons/nearby
// @access  Public
exports.getNearbySalons = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitudine e longitudine richieste' });
    }

    // Calcola i limiti geografici approssimativi
    const latRadius = radius / 111; // 1 grado lat ~= 111 km
    const lngRadius = radius / (111 * Math.cos(lat * Math.PI / 180));

    const salons = await Salon.find({
      attivo: true,
      'coordinate.lat': { $gte: parseFloat(lat) - latRadius, $lte: parseFloat(lat) + latRadius },
      'coordinate.lng': { $gte: parseFloat(lng) - lngRadius, $lte: parseFloat(lng) + lngRadius }
    }).populate('proprietarioId', 'nome cognome email telefono');

    // Calcola distanza per ogni salone
    const salonsWithDistance = salons.map(salon => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        salon.coordinate.lat,
        salon.coordinate.lng
      );
      return {
        ...salon.toObject(),
        distanza: parseFloat(distance.toFixed(2))
      };
    }).filter(salon => salon.distanza <= radius)
      .sort((a, b) => a.distanza - b.distanza);

    res.json(salonsWithDistance);
  } catch (error) {
    console.error('Errore ricerca saloni vicini:', error);
    res.status(500).json({ message: 'Errore durante la ricerca dei saloni' });
  }
};

// @desc    Ottieni salone per ID
// @route   GET /api/salons/:id
// @access  Public
exports.getSalonById = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('proprietarioId', 'nome cognome email telefono fotoProfilo');
    
    if (!salon) {
      return res.status(404).json({ message: 'Salone non trovato' });
    }

    res.json(salon);
  } catch (error) {
    console.error('Errore recupero salone:', error);
    res.status(500).json({ message: 'Errore durante il recupero del salone' });
  }
};

// @desc    Aggiorna salone
// @route   PUT /api/salons/:id
// @access  Private (solo proprietario o admin)
exports.updateSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({ message: 'Salone non trovato' });
    }

    // Verifica che l'utente sia il proprietario o admin
    if (salon.proprietarioId.toString() !== req.user._id.toString() && req.user.ruolo !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const updatedSalon = await Salon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedSalon);
  } catch (error) {
    console.error('Errore aggiornamento salone:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento del salone' });
  }
};

// @desc    Elimina salone
// @route   DELETE /api/salons/:id
// @access  Private (solo proprietario o admin)
exports.deleteSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({ message: 'Salone non trovato' });
    }

    // Verifica che l'utente sia il proprietario o admin
    if (salon.proprietarioId.toString() !== req.user._id.toString() && req.user.ruolo !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    // Soft delete - imposta attivo a false
    salon.attivo = false;
    await salon.save();

    res.json({ message: 'Salone disattivato con successo' });
  } catch (error) {
    console.error('Errore eliminazione salone:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione del salone' });
  }
};

// @desc    Ottieni il salone dell'utente corrente
// @route   GET /api/salons/my-salon
// @access  Private
exports.getMySalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({ proprietarioId: req.user._id });
    
    if (!salon) {
      return res.status(404).json({ message: 'Non hai un salone registrato' });
    }

    res.json(salon);
  } catch (error) {
    console.error('Errore recupero salone utente:', error);
    res.status(500).json({ message: 'Errore durante il recupero del salone' });
  }
};

// Helper function per calcolare distanza
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raggio della Terra in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = exports;
