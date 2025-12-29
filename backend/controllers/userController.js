const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Ottieni profilo utente corrente
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    console.error('Errore nel recupero del profilo:', error);
    res.status(500).json({ message: 'Errore nel recupero del profilo' });
  }
};

// @desc    Aggiorna profilo utente
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Campi base
    if (req.body.nome) user.nome = req.body.nome;
    if (req.body.cognome) user.cognome = req.body.cognome;
    if (req.body.telefono) user.telefono = req.body.telefono;
    if (req.body.email) user.email = req.body.email;
    
    // Campi profilo
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.dataNascita !== undefined) user.dataNascita = req.body.dataNascita;
    if (req.body.fotoProfilo !== undefined) user.fotoProfilo = req.body.fotoProfilo;
    
    // Indirizzo
    if (req.body.indirizzo) {
      user.indirizzo = {
        via: req.body.indirizzo.via || user.indirizzo.via,
        citta: req.body.indirizzo.citta || user.indirizzo.citta,
        cap: req.body.indirizzo.cap || user.indirizzo.cap,
        provincia: req.body.indirizzo.provincia || user.indirizzo.provincia
      };
    }
    
    // Preferenze
    if (req.body.preferenze) {
      user.preferenze = {
        notificheEmail: req.body.preferenze.notificheEmail !== undefined 
          ? req.body.preferenze.notificheEmail 
          : user.preferenze.notificheEmail,
        notificheSMS: req.body.preferenze.notificheSMS !== undefined 
          ? req.body.preferenze.notificheSMS 
          : user.preferenze.notificheSMS,
        linguaPreferita: req.body.preferenze.linguaPreferita || user.preferenze.linguaPreferita
      };
    }
    
    // Social links
    if (req.body.socialLinks) {
      user.socialLinks = {
        facebook: req.body.socialLinks.facebook !== undefined 
          ? req.body.socialLinks.facebook 
          : user.socialLinks.facebook,
        instagram: req.body.socialLinks.instagram !== undefined 
          ? req.body.socialLinks.instagram 
          : user.socialLinks.instagram,
        twitter: req.body.socialLinks.twitter !== undefined 
          ? req.body.socialLinks.twitter 
          : user.socialLinks.twitter
      };
    }

    user.updatedAt = Date.now();
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      nome: updatedUser.nome,
      cognome: updatedUser.cognome,
      email: updatedUser.email,
      telefono: updatedUser.telefono,
      ruolo: updatedUser.ruolo,
      fotoProfilo: updatedUser.fotoProfilo,
      bio: updatedUser.bio,
      dataNascita: updatedUser.dataNascita,
      indirizzo: updatedUser.indirizzo,
      preferenze: updatedUser.preferenze,
      socialLinks: updatedUser.socialLinks,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del profilo:', error);
    res.status(500).json({ message: 'Errore nell\'aggiornamento del profilo' });
  }
};

// @desc    Cambia password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Fornire password attuale e nuova password' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Verifica password attuale
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password attuale non corretta' });
    }

    // Valida nuova password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nuova password deve essere di almeno 6 caratteri' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Errore nel cambio password:', error);
    res.status(500).json({ message: 'Errore nel cambio password' });
  }
};

// @desc    Upload foto profilo
// @route   POST /api/users/profile/photo
// @access  Private
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'URL foto non fornito' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    user.fotoProfilo = photoUrl;
    user.updatedAt = Date.now();
    await user.save();

    res.json({ 
      message: 'Foto profilo aggiornata',
      fotoProfilo: user.fotoProfilo 
    });
  } catch (error) {
    console.error('Errore nell\'upload foto profilo:', error);
    res.status(500).json({ message: 'Errore nell\'upload foto profilo' });
  }
};

// @desc    Elimina account utente
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password richiesta per eliminare l\'account' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Verifica password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password non corretta' });
    }

    // Disattiva invece di eliminare (soft delete)
    user.attivo = false;
    await user.save();

    res.json({ message: 'Account disattivato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione account:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione account' });
  }
};

// @desc    Ottieni statistiche utente
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    
    const stats = await Appointment.aggregate([
      { $match: { clienteId: req.user._id } },
      {
        $group: {
          _id: '$stato',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAppointments = await Appointment.countDocuments({ clienteId: req.user._id });
    const completedAppointments = await Appointment.countDocuments({ 
      clienteId: req.user._id, 
      stato: 'completato' 
    });
    const cancelledAppointments = await Appointment.countDocuments({ 
      clienteId: req.user._id, 
      stato: 'cancellato' 
    });
    const upcomingAppointments = await Appointment.countDocuments({ 
      clienteId: req.user._id, 
      stato: 'confermato',
      dataOra: { $gte: new Date() }
    });

    res.json({
      total: totalAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      upcoming: upcomingAppointments,
      byStatus: stats
    });
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error);
    res.status(500).json({ message: 'Errore nel recupero statistiche' });
  }
};
