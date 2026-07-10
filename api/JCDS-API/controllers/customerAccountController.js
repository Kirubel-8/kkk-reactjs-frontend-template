const { CustomerAccount } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { sendSMS } = require("../utils/sms");
const { sendEmail } = require("../utils/email");

require("dotenv").config();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// const sendEmail = async (email, subject, text) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: subject,
//     text: text,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new Error(`Failed to send email. ${error}`);
//   }
// };

const createCustomerAccount = async (req, res) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      phone_number,
      password,
      gender,
    } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters with uppercase, lowercase, number, and special character",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer_id = uuidv4();

    let full_name = [first_name, middle_name, last_name]
      .filter(Boolean)
      .join(" ");

    if (!full_name || full_name.trim() === "") {
      const count = await CustomerAccount.count();
      full_name = `Anonymous ${count + 1}`;
    }  

    const customerData = {
      email: email || null,
      customer_id,
      full_name,
      gender,
      phone_number,
      password: hashedPassword,
      account_status: false,
      otp,
      otp_expiry: otpExpiry,
    };

    await CustomerAccount.create(customerData);

    const emailMessage = `
      Dear Customer,

      Thank you for registering with JCDMS. To complete your account verification, please use the following One-Time Password (OTP):

      OTP: ${otp}

      Please note, the OTP is valid for 10 minutes from the time of receipt. If you did not initiate this request, please contact our support team immediately.

      Best regards,
      The JCDMS Team
    `;

    const smsMessage = `Dear Customer, your OTP for JCDMS account verification is ${otp}. This OTP is valid for 10 minutes.`;

    const notifyMethod = process.env.NOTIFICATION_METHOD || "email";

    if (notifyMethod === "email" && email) {
      await sendEmail(email, "Account Verification OTP for JCDMS", emailMessage);
    } else if (notifyMethod === "sms") {
      // await sendSMS(phone_number, smsMessage); //after sms integration
      if (!email) {
        console.log(`[DEV OTP] To: ${phone_number} - OTP: ${otp}`);
      } else {
        await sendSMS(phone_number, smsMessage);
      }
    } else if (notifyMethod === "both") {
      const promises = [];
      if (email) promises.push(sendEmail(email, "Account Verification OTP for JCDMS", emailMessage));
      // if (phone_number) promises.push(sendSMS(phone_number, smsMessage)); //for production
      if (phone_number) {
        if (!email) {
          console.log(`[DEV OTP] To: ${phone_number} - OTP: ${otp}`);
        } else {
          promises.push(sendSMS(phone_number, smsMessage));
        }
      }
      await Promise.all(promises);
    } else if (email) {
      await sendEmail(email, "Account Verification OTP for JCDMS", emailMessage);
    } else if (phone_number) {
        // only log OTP for dev
        console.log(`[DEV OTP] To: ${phone_number} - OTP: ${otp}`);
    }

    res.status(201).json({
      message: `Account created successfully. Please check your ${notifyMethod === "sms" ? "phone" : "email"
        } for OTP.`,
    });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        message: "Error",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, phone_number, otp } = req.body;

    const customer = await CustomerAccount.findOne({
      // where: { email }
      where: email ? { email } : { phone_number }
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    console.log("OTP in database:", customer.otp);
    console.log("OTP from request:", otp);

    if (customer.otp === otp && new Date() < new Date(customer.otp_expiry)) {
      customer.account_status = true;
      customer.otp = null;
      customer.otp_expiry = null;
      await customer.save();
      const token = jwt.sign(
        { id: customer.customer_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION_TIME }
      );

      return res.status(200).json({
        token,
        customer,
        message: "Customer account activated successfully.",
      });
    } else {
      res.status(400).json({ message: "Invalid OTP or OTP expired." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};

// const resendOTP = async (req, res) => {
//   try {
//     const { email, phone_number } = req.body;

//     const customer = await CustomerAccount.findOne({
//       where: email ? { email } : { phone_number }
//     });
//     if (!customer) {
//       return res.status(404).json({ message: "Customer not found." });
//     }

//     const otp = generateOTP();
//     const otpExpiry = new Date();
//     otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

//     customer.otp = otp;
//     customer.otp_expiry = otpExpiry;
//     await customer.save();

//     await sendEmail(
//       email,
//       "Your OTP for Account Verification",
//       `Your OTP is: ${otp}\n\nPlease use this OTP within 10 minutes to verify your account.`
//     );

//     res.status(200).json({ message: "OTP resent successfully." });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error resending OTP", error: error.message });
//   }
// };

const resendOTP = async (req, res) => {
  try {
    const { email, phone_number } = req.body;

    const customer = await CustomerAccount.findOne({
      where: email ? { email } : { phone_number }
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    customer.otp = otp;
    customer.otp_expiry = otpExpiry;
    await customer.save();

    if (email) {
      await sendEmail(
        email,
        "Your JCDMS OTP",
        `Your OTP is: ${otp}. It expires in 10 minutes.`
      );
    }

    await sendSMS(
      customer.phone_number,
      `Your JCDMS OTP is ${otp}. Valid for 10 minutes.`
    );

    res.status(200).json({
      message: `OTP resent via ${email ? "email and SMS" : "SMS"}`
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error resending OTP",
      error: error.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const customer_id = req.params.customer_id;
    const updateFields = {};

    if (new_password) {
      if (new_password !== confirm_password) {
        return res.status(400).json({
          message: "New password and confirmation password do not match.",
        });
      }

      const customer = await CustomerAccount.findByPk(customer_id);
      if (!customer) {
        return res.status(404).json({ message: "CUstomer not found." });
      }

      const isMatch = await bcrypt.compare(current_password, customer.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateFields.password = hashedPassword;
    }

    if (req.file) {
      updateFields.img_url = path.normalize(req.file.path);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const [updated] = await CustomerAccount.update(updateFields, {
      where: { customer_id: customer_id },
    });

    if (updated) {
      const updatedCustomer = await CustomerAccount.findByPk(customer_id);
      res.status(200).json(updatedCustomer);
    } else {
      res.status(404).json({ message: "Customer not found." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const customers = await CustomerAccount.findAll();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await CustomerAccount.findByPk(req.params.id);
    if (customer) {
      res.status(200).json(customer);
    } else {
      res.status(404).json({ message: "Customer not found." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const deleted = await CustomerAccount.destroy({
      where: { customer_id: req.params.id },
    });
    if (deleted) {
      res
        .status(200)
        .json({ message: "Customer account deleted successfully." });
    } else {
      res.status(404).json({ message: "Customer not found." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error deleting customer account",
      error: error.message,
    });
  }
};

const updateCustomerStatus = async (req, res) => {
  const { status } = req.body;

  if (typeof status !== "boolean") {
    return res.status(400).json({
      message:
        "Invalid status. Status must be a boolean value (true or false).",
    });
  }

  try {
    const customer = await CustomerAccount.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    customer.account_status = status;
    await customer.save();

    res.status(200).json({
      message: `User status updated successfully`,
      customer: {
        user_id: customer.user_id,
        full_name: customer.full_name,
        email: customer.email,
        account_status: customer.account_status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user status",
      error: error.message,
    });
  }
};

const updateCustomerName = async (req, res) => {
  try {
    const { full_name } = req.body;
    const customer_id = req.params.customer_id;

    if (!full_name || full_name.trim() === "") {
      return res.status(400).json({ message: "Full name is required." });
    }

    const [updated] = await CustomerAccount.update(
      { full_name },
      { where: { customer_id } }
    );

    if (!updated) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const updatedCustomer = await CustomerAccount.findByPk(customer_id);

    res.status(200).json({
      message: "Name updated successfully.",
      customer: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createCustomerAccount,
  verifyOTP,
  resendOTP,
  updateCustomer,
  getAllCustomers,
  getCustomerById,
  deleteCustomer,
  updateCustomerStatus,
  updateCustomerName
};
