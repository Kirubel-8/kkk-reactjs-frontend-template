const express = require("express");
const router = express.Router();
const {
  createCustomerAccount,
  verifyOTP,
  resendOTP,
  updateCustomer,
  getAllCustomers,
  getCustomerById,
  deleteCustomer,
  updateCustomerStatus,
  updateCustomerName,
} = require("../controllers/customerAccountController");
const {
  validateCreateCustomer,
  validateVerifyOTP,
  validateUpdateCustomer,
} = require("../validators/customerAccountValidator");

const multer = require("multer");
const { validateLogin } = require("../validators/authValidator");
const { validateCustomerAuth } = require("../validators/customerAuthValidator");
const { verifyToken } = require("../middleware/authMiddleware");
const customerAuthController = require("../controllers/customerAuthController");
const path = require("path")


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile_pictures');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer account management
 */

/**
 * @swagger
 * /api/customer-accounts:
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               phone_number:
 *                 type: string
 *                 example: +251912345678
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *               gender:
 *                 type: string
 *                 example: male
 *     responses:
 *       201:
 *         description: Customer account created successfully. OTP sent to email.
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customer-accounts/verify-otp:
 *   post:
 *     tags: [Customers]
 *     summary: Verify OTP for customer registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: +251912345678
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified successfully, account activated.
 *       400:
 *         description: Invalid OTP or OTP expired.
 *       404:
 *         description: Customer not found.
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customer-accounts/resend-otp:
 *   post:
 *     tags: [Customers]
 *     summary: Resend OTP for customer registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: +251912345678
 *     responses:
 *       200:
 *         description: OTP resent successfully.
 *       404:
 *         description: Customer not found.
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customer-accounts/login:
 *   post:
 *     tags: [Customers]
 *     summary: Customer login using phone number and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: +251912345678
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: Login successful, token returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: your.jwt.token.here
 *       401:
 *         description: Unauthorized - Invalid credentials
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customer-accounts/update/{id}:
 *   put:
 *     tags: [Customers]
 *     summary: Update customer details
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID to be updated
 *         schema:
 *           type: string
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: John Michael Doe
 *               gender:
 *                 type: string
 *                 example: male
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found.
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customer-accounts:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers
 *     responses:
 *       200:
 *         description: List of all customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   phone_number:
 *                     type: string
 *                     example: +251912345678
 *                   full_name:
 *                     type: string
 *                     example: John Doe
 *                   gender:
 *                     type: string
 *                     example: male
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID to fetch
 *         schema:
 *           type: string
 *           example: 1
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 phone_number:
 *                   type: string
 *                   example: +251912345678
 *                 full_name:
 *                   type: string
 *                   example: John Doe
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     tags: [Customers]
 *     summary: Delete a customer
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID to delete
 *         schema:
 *           type: string
 *           example: 1
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */

router.post("/", validateCreateCustomer, createCustomerAccount);
router.post("/verify-otp", validateVerifyOTP, verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", validateCustomerAuth, customerAuthController.login);
router.post("/reset-password-request", customerAuthController.resetPasswordRequest);
router.post("/reset-password", customerAuthController.resetPassword);
// router.put("/update/:id", validateUpdateCustomer, updateCustomer);

router.put("/update/:customer_id", upload.single('profile_picture'), validateUpdateCustomer, updateCustomer);

router.get("/", getAllCustomers);
router.get("/:id",verifyToken, getCustomerById);
router.delete("/:id", deleteCustomer);
router.put("/:id", updateCustomerStatus)

router.put("/update-name/:customer_id", verifyToken, updateCustomerName);

module.exports = router;
