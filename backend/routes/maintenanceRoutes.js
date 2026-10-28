const express = require('express');
const {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('admin', 'manager'));

router.get('/', getMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.delete('/:id', deleteMaintenanceRecord);

module.exports = router;
