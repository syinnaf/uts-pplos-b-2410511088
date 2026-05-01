const express = require('express');
const fieldController = require('../controllers/fieldController');
const { verifyInternalToken } = require('../middlewares/internalTokenMiddleware');

const router = express.Router();

router.get('/fields', fieldController.listFields);
router.post('/fields', fieldController.createField);
router.get('/fields/:id/slots', fieldController.getFieldSlots);
router.patch(
  '/fields/:id/slots/:slotId/status',
  verifyInternalToken,
  fieldController.updateSlotStatus
);
router.get('/fields/:id', fieldController.getFieldById);
router.put('/fields/:id', fieldController.updateField);
router.delete('/fields/:id', fieldController.deleteField);

router.post('/venues', fieldController.createVenue);
router.put('/venues/:id', fieldController.updateVenue);
router.delete('/venues/:id', fieldController.deleteVenue);

module.exports = router;