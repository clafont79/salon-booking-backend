const express = require('express');
const router = express.Router();
const {
  createOperator,
  getOperators,
  getOperatorById,
  updateOperator,
  deleteOperator,
  updateDisponibilita
} = require('../controllers/operatorController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('admin'), createOperator)
  .get(getOperators);

router.route('/:id')
  .get(getOperatorById)
  .put(protect, authorize('admin'), updateOperator)
  .delete(protect, authorize('admin'), deleteOperator);

router.put('/:id/disponibilita', protect, authorize('admin'), updateDisponibilita);

module.exports = router;
