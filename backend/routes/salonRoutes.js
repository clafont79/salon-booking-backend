const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSalon,
  getAllSalons,
  getNearbySalons,
  getSalonById,
  updateSalon,
  deleteSalon,
  getMySalon
} = require('../controllers/salonController');

// Routes pubbliche
router.get('/', getAllSalons);
router.get('/nearby', getNearbySalons);
router.get('/:id', getSalonById);

// Routes protette
router.post('/', protect, createSalon);
router.get('/my/salon', protect, getMySalon);
router.put('/:id', protect, updateSalon);
router.delete('/:id', protect, deleteSalon);

module.exports = router;
