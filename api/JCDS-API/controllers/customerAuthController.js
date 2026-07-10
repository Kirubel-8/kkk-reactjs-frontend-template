const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { CustomerAccount } = require("../models");
const { blacklistToken } = require("../middleware/authMiddleware");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const login = async (req, res) => {
  const { phone_number, password } = req.body;
  try {
    const customer = await CustomerAccount.findOne({
      where: { phone_number: phone_number },
    });
    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!customer.account_status) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: customer.customer_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME }
    );

    return res.status(200).json({ token, customer });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logout = (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No active session" });
  }

  blacklistToken(token);
  return res.status(204).send();
};

const resetPasswordRequest = async (req, res) => {
  const { email } = req.body;
  try {
    const customer = await CustomerAccount.findOne({ where: { email } });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    customer.resetToken = resetToken;
    customer.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await customer.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://localhost:3001/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request for Your JCDMS Account",
      text:
        `Dear ${customer.full_name},\n\n` +
        `We received a request to reset the password for your JCDMS account associated with the email address ${email}.\n\n` +
        `To reset your password, please click on the link below or paste it into your browser:\n\n` +
        `${resetLink}\n\n` +
        `This link will expire in 1 hour. If you did not request a password reset, you can ignore this email.\n\n` +
        `For your security, we recommend that you change your password regularly and keep it secure.\n\n` +
        `If you need any assistance, feel free to reach out to our support team.\n\n` +
        `Best regards,\nThe JCDMS Team`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ message: "Password reset link sent to your email" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  try {
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const customer = await CustomerAccount.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: { [Op.gt]: Date.now() },
      },
    });

    if (!customer) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    customer.password = hashedPassword;
    customer.resetToken = null;
    customer.resetTokenExpiration = null;
    await customer.save();

    return res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  logout,
  resetPasswordRequest,
  resetPassword,
};
