const { Notification } = require('../models');
const { v4: uuidv4 } = require('uuid');

exports.getNotifications = async (req, res) => {
    try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "You are not logged in" });

    const notifications = await Notification.findAll({
            where: { recipient_customer_id: userId },
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "You are not logged in" });
        const unReadableNotifications = await Notification.findAll({ where: { recipient_customer_id: userId, is_read: false } });
        if (unReadableNotifications.length === 0) {
            return res.status(200).json({ message: "All notifications are already read" });
        }
        await Notification.update({ is_read: true }, { where: { recipient_customer_id: userId } });
        res.status(200).json({ message: "All notifications marked as read successfully" });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "You are not logged in" });

        const [updatedCount] = await Notification.update(
            { is_read: true },
            { where: { notification_id: req.params.notification_id, recipient_customer_id: userId } }
        );

        if (updatedCount === 0) {
            return res.status(404).json({ message: "Notification not found or already read" });
        }

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};