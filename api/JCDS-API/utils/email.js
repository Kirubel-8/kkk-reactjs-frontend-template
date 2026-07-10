const nodemailer = require("nodemailer");
const logger = require("./logger");

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "Gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465,
    secure: process.env.EMAIL_SECURE === "true" || true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to} | Subject: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to} | Error: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendEmail,
};
