const { Notification } = require("../models");

const sendNotification = async (userIds, message, io) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      const newNotification = await Notification.create({
        notification_sent_to: userId,
        notification_sent_by: userId,
        notification_body: message,
        notification_sent_date: new Date(),
      });

      const socketId = require("../app").onlineUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit("notification", newNotification);
      }

      notifications.push(newNotification);
    }

    return notifications;
  } catch (error) {
    console.error("Error sending notifications:", error);
    throw new Error("Server error: " + error.message);
  }
};

module.exports = { sendNotification };
