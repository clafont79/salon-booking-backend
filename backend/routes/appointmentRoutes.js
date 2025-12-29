const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
  getUniqueServices
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, createAppointment)
  .get(protect, getAppointments);

router.get('/available-slots', getAvailableSlots);
router.get('/services/unique', getUniqueServices);

router.route('/:id')
  .get(protect, getAppointmentById)
  .put(protect, updateAppointment)
  .delete(protect, deleteAppointment);

module.exports = router;
