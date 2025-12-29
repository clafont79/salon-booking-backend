const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protegge le route che richiedono autenticazione
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Estrai token dall'header
      token = req.headers.authorization.split(' ')[1];

      // Verifica token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Aggiungi utente alla request
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Errore autenticazione:', error);
      return res.status(401).json({ message: 'Non autorizzato, token non valido' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorizzato, token mancante' });
  }
};

// Restringe l'accesso ai ruoli specificati
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.ruolo)) {
      return res.status(403).json({ 
        message: `Ruolo ${req.user.ruolo} non autorizzato ad accedere a questa risorsa` 
      });
    }
    next();
  };
};
