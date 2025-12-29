const Operator = require('../models/Operator');
const User = require('../models/User');

// @desc    Crea nuovo operatore
// @route   POST /api/operators
// @access  Private/Admin
exports.createOperator = async (req, res) => {
  try {
    const { userId, specializzazioni, descrizione, colore, disponibilita } = req.body;

    // Verifica che l'utente esista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Aggiorna ruolo utente a operatore
    user.ruolo = 'operatore';
    await user.save();

    const operator = await Operator.create({
      userId,
      specializzazioni,
      descrizione,
      colore: colore || '#3880ff',
      disponibilita: disponibilita || []
    });

    const populatedOperator = await Operator.findById(operator._id)
      .populate('userId', 'nome cognome email telefono');

    res.status(201).json(populatedOperator);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la creazione dell\'operatore', error: error.message });
  }
};

// @desc    Ottieni tutti gli operatori
// @route   GET /api/operators
// @access  Public
exports.getOperators = async (req, res) => {
  try {
    const { attivo } = req.query;
    
    let query = {};
    if (attivo !== undefined) {
      query.attivo = attivo === 'true';
    }

    const operators = await Operator.find(query)
      .populate('userId', 'nome cognome email telefono')
      .sort({ createdAt: -1 });

    res.json(operators);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero degli operatori', error: error.message });
  }
};

// @desc    Ottieni operatore per ID
// @route   GET /api/operators/:id
// @access  Public
exports.getOperatorById = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id)
      .populate('userId', 'nome cognome email telefono');

    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    res.json(operator);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero dell\'operatore', error: error.message });
  }
};

// @desc    Aggiorna operatore
// @route   PUT /api/operators/:id
// @access  Private/Admin
exports.updateOperator = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    const { specializzazioni, descrizione, colore, disponibilita, attivo } = req.body;

    operator.specializzazioni = specializzazioni || operator.specializzazioni;
    operator.descrizione = descrizione !== undefined ? descrizione : operator.descrizione;
    operator.colore = colore || operator.colore;
    operator.disponibilita = disponibilita || operator.disponibilita;
    operator.attivo = attivo !== undefined ? attivo : operator.attivo;

    const updatedOperator = await operator.save();

    const populatedOperator = await Operator.findById(updatedOperator._id)
      .populate('userId', 'nome cognome email telefono');

    res.json(populatedOperator);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'operatore', error: error.message });
  }
};

// @desc    Cancella operatore
// @route   DELETE /api/operators/:id
// @access  Private/Admin
exports.deleteOperator = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    await operator.deleteOne();
    res.json({ message: 'Operatore eliminato' });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'operatore', error: error.message });
  }
};

// @desc    Aggiorna disponibilità operatore
// @route   PUT /api/operators/:id/disponibilita
// @access  Private/Admin
exports.updateDisponibilita = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
      return res.status(404).json({ message: 'Operatore non trovato' });
    }

    operator.disponibilita = req.body.disponibilita;
    const updatedOperator = await operator.save();

    const populatedOperator = await Operator.findById(updatedOperator._id)
      .populate('userId', 'nome cognome email telefono');

    res.json(populatedOperator);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento della disponibilità', error: error.message });
  }
};

module.exports = exports;
