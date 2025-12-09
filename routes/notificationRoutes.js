const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Tutte le route richiedono autenticazione
router.use(protect);

// GET /api/notifications - Ottieni tutte le notifiche (con query params ?letto=true/false&limit=50)
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count - Ottieni conteggio notifiche non lette
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/mark-all-read - Marca tutte come lette
router.put('/mark-all-read', notificationController.markAllAsRead);

// DELETE /api/notifications/read - Elimina tutte le notifiche lette
router.delete('/read', notificationController.deleteAllRead);

// PUT /api/notifications/:id/read - Marca una notifica come letta
router.put('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id - Elimina una notifica
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
