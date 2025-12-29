const Configuration = require('../models/Configuration');

// @desc    Ottieni tutte le configurazioni
// @route   GET /api/config
// @access  Private/Admin
exports.getAllConfigurations = async (req, res) => {
  try {
    const configurations = await Configuration.find();
    
    // Se non ci sono configurazioni, crea quelle di default
    if (configurations.length === 0) {
      const defaultConfig = Configuration.getDefaultConfig();
      const configArray = Object.values(defaultConfig);
      await Configuration.insertMany(configArray);
      const newConfigurations = await Configuration.find();
      return res.json(newConfigurations);
    }

    res.json(configurations);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero delle configurazioni', error: error.message });
  }
};

// @desc    Ottieni configurazione per chiave
// @route   GET /api/config/:chiave
// @access  Public
exports.getConfigurationByKey = async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ chiave: req.params.chiave });

    if (!configuration) {
      return res.status(404).json({ message: 'Configurazione non trovata' });
    }

    res.json(configuration);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante il recupero della configurazione', error: error.message });
  }
};

// @desc    Aggiorna configurazione
// @route   PUT /api/config/:chiave
// @access  Private/Admin
exports.updateConfiguration = async (req, res) => {
  try {
    const { valore, descrizione } = req.body;

    let configuration = await Configuration.findOne({ chiave: req.params.chiave });

    if (!configuration) {
      // Crea nuova configurazione se non esiste
      configuration = await Configuration.create({
        chiave: req.params.chiave,
        valore,
        descrizione
      });
    } else {
      configuration.valore = valore !== undefined ? valore : configuration.valore;
      configuration.descrizione = descrizione !== undefined ? descrizione : configuration.descrizione;
      configuration.updatedAt = Date.now();
      await configuration.save();
    }

    res.json(configuration);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'aggiornamento della configurazione', error: error.message });
  }
};

// @desc    Cancella configurazione
// @route   DELETE /api/config/:chiave
// @access  Private/Admin
exports.deleteConfiguration = async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ chiave: req.params.chiave });

    if (!configuration) {
      return res.status(404).json({ message: 'Configurazione non trovata' });
    }

    await configuration.deleteOne();
    res.json({ message: 'Configurazione eliminata' });
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'eliminazione della configurazione', error: error.message });
  }
};

// @desc    Inizializza configurazioni di default
// @route   POST /api/config/init
// @access  Private/Admin
exports.initializeDefaultConfig = async (req, res) => {
  try {
    const defaultConfig = Configuration.getDefaultConfig();
    const configArray = Object.values(defaultConfig);
    
    // Inserisci solo se non esistono già
    for (const config of configArray) {
      const existing = await Configuration.findOne({ chiave: config.chiave });
      if (!existing) {
        await Configuration.create(config);
      }
    }

    const configurations = await Configuration.find();
    res.json(configurations);
  } catch (error) {
    res.status(500).json({ message: 'Errore durante l\'inizializzazione delle configurazioni', error: error.message });
  }
};

module.exports = exports;
