const express = require('express');
const router = express.Router();
const {
  getAllConfigurations,
  getConfigurationByKey,
  updateConfiguration,
  deleteConfiguration,
  initializeDefaultConfig
} = require('../controllers/configController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAllConfigurations);
router.post('/init', protect, authorize('admin'), initializeDefaultConfig);

router.route('/:chiave')
  .get(getConfigurationByKey)
  .put(protect, authorize('admin'), updateConfiguration)
  .delete(protect, authorize('admin'), deleteConfiguration);

module.exports = router;
