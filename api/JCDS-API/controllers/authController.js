const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Role, Permission } = require("../models");
const { blacklistToken } = require("../middleware/authMiddleware");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const login = async(req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email);
    // console.log("database url",config.database,config.username, config.password);
    try {
        const user = await User.findOne({
            where: { email: email },
            include: [{
                model: Role,
                as: "roles",
                include: [{
                    model: Permission,
                    as: "permissions",
                }, ],
            }, ],
        });
        console.log("User found:", user ? user.full_name : "No user found");
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.account_status) {
            return res.status(403).json({ message: "Account is deactivated." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const role_ids = (user.roles && user.roles.map(role => role.id)) || [];


        const token = jwt.sign({ id: user.user_id,department_id: user.department_id, }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME_BackOffice || "3h",
        });
        console.log("token", token,process.env.JWT_EXPIRATION_TIME_BackOffice);

        return res.status(200).json({ token, user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getPermissionsByUserId = async(req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findOne({
            where: { user_id: userId },
            include: [{
                model: Role,
                as: "roles",
                include: [{
                    model: Permission,
                    as: "permissions",
                }, ],
            }, ],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const permissions = user.roles.reduce((result, role) => {
            return result.concat(role.permissions);
        }, []);

        const permissionNames = permissions.map((p) => p);

        return res.status(200).json({ permissions: permissionNames });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `Error fetching permissions: ${error.message}` });
    }
};

const logout = (req, res) => {
    let token;
    if (req.headers["authorization"]) {
        token = req.headers["authorization"].split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "No active session" });
    }

    blacklistToken(token);
    return res.status(204).send();
};

const resetPasswordRequest = async(req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

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

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request for Your JCDMS Account",
            text: `Dear ${user.full_name},\n\n` +
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

const resetPassword = async(req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    try {
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpiration: {
                    [Op.gt]: Date.now()
                },
            },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiration = null;
        await user.save();

        return res.status(200).json({ message: "Password successfully reset" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    login,
    getPermissionsByUserId,
    logout,
    resetPasswordRequest,
    resetPassword,
};