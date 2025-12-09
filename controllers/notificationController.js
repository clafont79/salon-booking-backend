const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');

// Ottieni tutte le notifiche dell'utente corrente
exports.getNotifications = async (req, res) => {
  try {
    const { letto, limit = 50 } = req.query;
    
    const query = { userId: req.user._id };
    if (letto !== undefined) {
      query.letto = letto === 'true';
    }

    const notifications = await Notification.find(query)
      .populate('appuntamentoId', 'servizio dataOra operatoreId clienteId')
      .sort({ dataInvio: -1 })
      .limit(parseInt(limit));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Errore nel recupero delle notifiche', error: error.message });
  }
};

// Ottieni conteggio notifiche non lette
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      letto: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Errore nel conteggio delle notifiche', error: error.message });
  }
};

// Marca una notifica come letta
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { letto: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notifica non trovata' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Errore nell\'aggiornamento della notifica', error: error.message });
  }
};

// Marca tutte le notifiche come lette
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, letto: false },
      { letto: true }
    );

    res.json({ message: 'Tutte le notifiche sono state marchiate come lette' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Errore nell\'aggiornamento delle notifiche', error: error.message });
  }
};

// Elimina una notifica
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifica non trovata' });
    }

    res.json({ message: 'Notifica eliminata con successo' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione della notifica', error: error.message });
  }
};

// Elimina tutte le notifiche lette
exports.deleteAllRead = async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.user._id,
      letto: true
    });

    res.json({ message: 'Tutte le notifiche lette sono state eliminate' });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione delle notifiche', error: error.message });
  }
};

// Crea una notifica (uso interno)
exports.createNotification = async (userId, tipo, titolo, messaggio, appuntamentoId = null) => {
  try {
    const notification = new Notification({
      userId,
      tipo,
      titolo,
      messaggio,
      appuntamentoId
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Crea notifiche per appuntamento imminente (chiamata da cron job)
exports.checkUpcomingAppointments = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Trova appuntamenti nelle prossime 24 ore
    const appointments24h = await Appointment.find({
      dataOra: {
        $gte: now,
        $lte: in24Hours
      },
      stato: 'confermato'
    }).populate('clienteId operatoreId');

    // Trova appuntamenti nella prossima ora
    const appointments1h = await Appointment.find({
      dataOra: {
        $gte: now,
        $lte: in1Hour
      },
      stato: 'confermato'
    }).populate('clienteId operatoreId');

    // Crea notifiche 24h
    for (const apt of appointments24h) {
      // Verifica se notifica già inviata
      const existingNotif = await Notification.findOne({
        appuntamentoId: apt._id,
        tipo: 'promemoria_24h'
      });

      if (!existingNotif) {
        // Notifica al cliente
        await exports.createNotification(
          apt.clienteId._id,
          'promemoria_24h',
          'Appuntamento domani',
          `Hai un appuntamento per ${apt.servizio} domani alle ${new Date(apt.dataOra).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
          apt._id
        );

        // Notifica all'operatore
        if (apt.operatoreId && apt.operatoreId.userId) {
          await exports.createNotification(
            apt.operatoreId.userId._id,
            'promemoria_24h',
            'Appuntamento domani',
            `Hai un appuntamento con ${apt.clienteId.nome} ${apt.clienteId.cognome} domani alle ${new Date(apt.dataOra).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
            apt._id
          );
        }
      }
    }

    // Crea notifiche 1h
    for (const apt of appointments1h) {
      const existingNotif = await Notification.findOne({
        appuntamentoId: apt._id,
        tipo: 'promemoria_1h'
      });

      if (!existingNotif) {
        // Notifica al cliente
        await exports.createNotification(
          apt.clienteId._id,
          'promemoria_1h',
          'Appuntamento tra 1 ora',
          `Il tuo appuntamento per ${apt.servizio} è tra 1 ora!`,
          apt._id
        );

        // Notifica all'operatore
        if (apt.operatoreId && apt.operatoreId.userId) {
          await exports.createNotification(
            apt.operatoreId.userId._id,
            'promemoria_1h',
            'Appuntamento tra 1 ora',
            `Appuntamento con ${apt.clienteId.nome} ${apt.clienteId.cognome} tra 1 ora!`,
            apt._id
          );
        }
      }
    }

    console.log(`Notifiche create: ${appointments24h.length} (24h), ${appointments1h.length} (1h)`);
  } catch (error) {
    console.error('Error checking upcoming appointments:', error);
  }
};
