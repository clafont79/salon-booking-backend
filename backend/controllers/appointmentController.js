const Appointment = require('../models/Appointment');
const Operator = require('../models/Operator');
const Salon = require('../models/Salon');
const Configuration = require('../models/Configuration');

// @desc    Crea nuovo appuntamento
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    console.log('Creating appointment with data:', req.body);
    console.log('User from token:', req.user);
    
    const { operatoreId, dataOra, durata, servizio, note, prezzo, salonId } = req.body;

    // Verifica disponibilità operatore
    const isAvailable = await checkOperatorAvailability(operatoreId, dataOra, durata);
    
    if (!isAvailable) {
      return res.status(400).json({ message: 'Slot non disponibile per questo operatore' });
    }

    const appointment = await Appointment.create({
      clienteId: req.user._id,
      operatoreId,
      salonId,
      dataOra,
      durata: durata || 30,
      servizio,
      note,
      prezzo: prezzo || 0
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('clienteId', 'nome cognome email telefono')
      .populate({
        path: 'operatoreId',
        populate: { path: 'userId', select: 'nome cognome' }
      })
      .populate('salonId', 'nome indirizzo citta telefono');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Errore durante la creazione dell\'appuntamento', error: error.message });
  }
};

// @desc    Ottieni tutti gli appuntamenti
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    const { operatoreId, data, stato } = req.query;
    
    let query = {};

    // Se non è admin, mostra solo i propri appuntamenti
    if (req.user.ruolo === 'cliente') {
      query.clienteId = req.user._id;
    }

    if (operatoreId) {
      query.operatoreId = operatoreId;
    }

    if (data) {
      const startDate = new Date(data);
      const endDate = new Date(data);
      endDate.setDate(endDate.getDate() + 1);
      query.dataOra = { $gte: startDate, $lt: endDate };
    }

    if (stato) {
      query.stato = stato;
    }

    const appointments = await Appointment.find(query)
      .populate('clienteId', 'nome cognome email telefono')
      .populate({
        path: 'operatoreId',
        populate: { path: 'userId', select: 'nome cognome' }
      })
      .populate('salonId', 'nome indirizzo citta telefono')
      .sort({ dataOra: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero degli appuntamenti', error: error.message });
  }
};

// @desc    Ottieni appuntamento per ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clienteId', 'nome cognome email telefono')
      .populate({
        path: 'operatoreId',
        populate: { path: 'userId', select: 'nome cognome' }
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    // Verifica autorizzazione
    if (req.user.ruolo === 'cliente' && appointment.clienteId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero dell\'appuntamento', error: error.message });
  }
};

// @desc    Aggiorna appuntamento
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    // Verifica autorizzazione
    if (req.user.ruolo === 'cliente' && appointment.clienteId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { operatoreId, dataOra, durata, servizio, note, stato, prezzo, salonId } = req.body;

    // Se cambiano data/ora/operatore, verifica disponibilità
    if ((dataOra && dataOra !== appointment.dataOra) || 
        (operatoreId && operatoreId !== appointment.operatoreId.toString()) ||
        (durata && durata !== appointment.durata)) {
      const isAvailable = await checkOperatorAvailability(
        operatoreId || appointment.operatoreId,
        dataOra || appointment.dataOra,
        durata || appointment.durata,
        appointment._id
      );
      
      if (!isAvailable) {
        return res.status(400).json({ message: 'Slot non disponibile' });
      }
    }

    appointment.operatoreId = operatoreId || appointment.operatoreId;
    appointment.salonId = salonId || appointment.salonId;
    appointment.dataOra = dataOra || appointment.dataOra;
    appointment.durata = durata || appointment.durata;
    appointment.servizio = servizio || appointment.servizio;
    appointment.note = note !== undefined ? note : appointment.note;
    appointment.stato = stato || appointment.stato;
    appointment.prezzo = prezzo !== undefined ? prezzo : appointment.prezzo;

    const updatedAppointment = await appointment.save();

    const populatedAppointment = await Appointment.findById(updatedAppointment._id)
      .populate('clienteId', 'nome cognome email telefono')
      .populate({
        path: 'operatoreId',
        populate: { path: 'userId', select: 'nome cognome' }
      });

    res.json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'appuntamento', error: error.message });
  }
};

// @desc    Cancella appuntamento
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appuntamento non trovato' });
    }

    // Verifica autorizzazione
    if (req.user.ruolo === 'cliente' && appointment.clienteId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    await appointment.deleteOne();
    res.json({ message: 'Appuntamento cancellato' });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante la cancellazione dell\'appuntamento', error: error.message });
  }
};

// @desc    Ottieni slot disponibili per operatore
// @route   GET /api/appointments/available-slots
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { operatoreId, data } = req.query;

    if (!operatoreId || !data) {
      return res.status(400).json({ message: 'operatoreId e data sono richiesti' });
    }

    const operator = await Operator.findById(operatoreId);
    if (!operator || !operator.attivo) {
      return res.status(404).json({ message: 'Operatore non trovato o non attivo' });
    }

    const targetDate = new Date(data);
    const dayOfWeek = targetDate.getDay();
    
    // Mappa numero giorno a nome giorno italiano
    const giorni = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    const nomeGiorno = giorni[dayOfWeek];

    // Trova disponibilità per quel giorno
    const disponibilita = operator.disponibilita.find(d => d.giornoSettimana === nomeGiorno);
    
    if (!disponibilita) {
      return res.json({ slots: [] });
    }

    // Ottieni configurazione intervallo
    const intervalConfig = await Configuration.findOne({ chiave: 'intervalloPrenotazione' });
    const interval = intervalConfig ? intervalConfig.valore : 30;

    // Genera tutti gli slot possibili
    const allSlots = generateTimeSlots(
      disponibilita.oraInizio,
      disponibilita.oraFine,
      interval,
      disponibilita.pausaPranzo ? disponibilita.inizioPausa : null,
      disponibilita.pausaPranzo ? disponibilita.finePausa : null
    );

    // Ottieni appuntamenti esistenti per quel giorno
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      operatoreId,
      dataOra: { $gte: startOfDay, $lte: endOfDay },
      stato: { $ne: 'cancellato' }
    });

    // Filtra slot occupati
    const availableSlots = allSlots.filter(slot => {
      const slotDateTime = new Date(targetDate);
      const [hours, minutes] = slot.split(':');
      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return !existingAppointments.some(apt => {
        const aptStart = new Date(apt.dataOra);
        const aptEnd = new Date(aptStart.getTime() + apt.durata * 60000);
        return slotDateTime >= aptStart && slotDateTime < aptEnd;
      });
    });

    res.json({ slots: availableSlots });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero degli slot disponibili', error: error.message });
  }
};

// Helper function: verifica disponibilità operatore
async function checkOperatorAvailability(operatoreId, dataOra, durata = 30, excludeAppointmentId = null) {
  console.log('checkOperatorAvailability called with:', { operatoreId, dataOra, durata, excludeAppointmentId });
  
  const startTime = new Date(dataOra);
  console.log('startTime:', startTime, 'isValid:', !isNaN(startTime.getTime()));
  
  if (isNaN(startTime.getTime())) {
    console.error('Invalid date provided:', dataOra);
    return false;
  }
  
  const endTime = new Date(startTime.getTime() + durata * 60000);

  // Cerca appuntamenti che si sovrappongono
  const query = {
    operatoreId,
    stato: { $ne: 'cancellato' }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  console.log('Query for conflicts:', query);
  
  // Prendi tutti gli appuntamenti dell'operatore e controlla manualmente la sovrapposizione
  const appointments = await Appointment.find(query);
  console.log('Total appointments found:', appointments.length);
  
  const conflicts = appointments.filter(apt => {
    const aptStart = new Date(apt.dataOra).getTime();
    const aptEnd = aptStart + (apt.durata || 30) * 60000;
    const newStart = startTime.getTime();
    const newEnd = endTime.getTime();
    
    // C'è conflitto se gli intervalli si sovrappongono
    return (newStart < aptEnd && newEnd > aptStart);
  });
  
  console.log('Conflicts found:', conflicts.length);
  return conflicts.length === 0;
}

// Helper function: genera slot temporali
function generateTimeSlots(startTime, endTime, interval, pauseStart, pauseEnd) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    // Controlla se è durante la pausa pranzo
    if (pauseStart && pauseEnd) {
      const [pauseStartHour, pauseStartMinute] = pauseStart.split(':').map(Number);
      const [pauseEndHour, pauseEndMinute] = pauseEnd.split(':').map(Number);
      
      const currentTime = currentHour * 60 + currentMinute;
      const pauseStartTime = pauseStartHour * 60 + pauseStartMinute;
      const pauseEndTime = pauseEndHour * 60 + pauseEndMinute;
      
      if (currentTime >= pauseStartTime && currentTime < pauseEndTime) {
        currentMinute += interval;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
        continue;
      }
    }
    
    slots.push(timeStr);
    
    currentMinute += interval;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}

// @desc    Ottieni servizi unici da tutti gli appuntamenti
// @route   GET /api/appointments/services/unique
// @access  Public
exports.getUniqueServices = async (req, res) => {
  try {
    const services = await Appointment.distinct('servizio');
    // Filter out empty strings and sort
    const uniqueServices = services
      .filter(s => s && s.trim().length > 0)
      .sort();
    res.json(uniqueServices);
  } catch (error) {
    console.error('Error getting unique services:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei servizi', error: error.message });
  }
};

module.exports = exports;
