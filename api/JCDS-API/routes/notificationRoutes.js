const express = require('express');
const router = express.Router();
const { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/customer/:customer_id', verifyToken, getNotifications);
router.patch('/customer/:customer_id/mark-all-read', verifyToken, markAllNotificationsAsRead);
router.patch('/customer/:notification_id/mark-as-read', verifyToken, markNotificationAsRead);
module.exports = router;