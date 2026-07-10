const {
  User,
  Department,
  UserHasRole,
  Role,
  UserHasDepartment,
  Team,
} = require("../models");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const { where } = require("sequelize");
const { Op } = require("sequelize");
const path = require("path");
const paginationMiddleware = require("../middleware/paginationMiddleware");
const baseDirectory = path.join(__dirname, "..", "public");
const fs = require("fs");
const fsPromises = fs.promises;
const { getSignedObsUrl } = require("../utils/obsUrlGenerator"); // Import the function
const { obsClient } = require("../utils/obsClient");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const bucketName = process.env.OBS_BUCKET || "cci-bucket";


const generateRandomPassword = (length = 6) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};



async function uploadToOBS(file, folder) {
  const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
  const objectKey = `${folder}/${uniqueName}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });
  await obsClient.send(command);
  return objectKey;
}


async function attachObsUrlsToUser(user) {
  if (!user) {
    return user;
  }

  const userPlain = user.toJSON ? user.toJSON() : { ...user };

  let signatureUrl = null;
  let titerUrl = null;

  if (userPlain.signature) {
    try {
      signatureUrl = await getSignedObsUrl(userPlain.signature);
    } catch (urlError) {
      console.warn(`Could not generate signature URL for user ${userPlain.user_id}:`, urlError.message);
    }
  }

  if (userPlain.titer) {
    try {
      titerUrl = await getSignedObsUrl(userPlain.titer);
    } catch (urlError) {
      console.warn(`Could not generate titer URL for user ${userPlain.user_id}:`, urlError.message);
    }
  }

  return {
    ...userPlain,
    signatureUrl: signatureUrl,
    titerUrl: titerUrl,
  };
}


const createUser = async (req, res) => {
  try {
    const { email, first_name, middle_name, last_name, role_ids, gender } =
      req.body;
    const existingUser = await User.findOne({
      where: { email: email },
      include: {
        model: Role,
        as: "roles",
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists.",
      });
    }
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = uuidv4();
    const full_name = [first_name, middle_name, last_name]
      .filter(Boolean)
      .join(" ");

    // OBS/S3 upload logic for signature and titer
    let signature = null;
    let titer = null;
   

    try {
      if (req.files?.signature?.[0]) {
        signature = await uploadToOBS(req.files.signature[0], "signatures");
      }
      if (req.files?.titer?.[0]) {
        titer = await uploadToOBS(req.files.titer[0], "titers");
      }
    } catch (err) {
      console.error("OBS Upload Error:", err);
      if (err.name === "InvalidEndpoint" || err.code === "ERR_INVALID_URL") {
        return res.status(500).json({
          message: "Invalid OBS endpoint configuration. Please check OBS_ENDPOINT in .env.",
          error: err.message,
        });
      }
      return res.status(500).json({ message: "Failed to upload file to OBS", error: err.message });
    }

    const userData = {
      email,
      user_id,
      full_name,
      gender,
      password: hashedPassword,
      account_status: true,
      signature,
      titer,
    };
    

    const user = await User.create(userData);

    if (Array.isArray(role_ids) && role_ids.length > 0) {
      const roles = await Role.findAll({
        where: {
          role_id: role_ids,
        },
      });

     

      if (roles.length !== role_ids.length) {
        return res.status(400).json({
          message: "Some of the provided role IDs are invalid or do not exist.",
        });
      }

      const userRolePromises = roles.map((role) => {
        const user_role_id = uuidv4();
        UserHasRole.create({
          user_role_id,
          user_id: user.user_id,
          role_id: role.role_id,
        });
      });

      await Promise.all(userRolePromises);

      
    }

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
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your CFMS Account Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; padding: 10px; background-color: #4DA8DA; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h1 style="color: #ffffff; margin: 0;">CFMS</h1>
          </div>
          <div style="padding: 20px; text-align: center;">
            <h2>Welcome to CFMS, ${full_name}!</h2>
            <p>Thank you for joining our community. To get started, please find your temporary password below.</p>
            <p style="font-size: 18px; font-weight: bold;">Temporary Password</p>
            <p style="font-size: 36px; font-weight: bold; color: #4DA8DA; margin: 0;">${password}</p>
            <p style="color: #777; font-size: 14px;">(Please change your password after logging in for the first time.)</p>
            <p style="margin-top: 20px;">If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div style="padding: 20px; background-color: #f1f8fc; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message. Please do not reply.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
   
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send({ message: "Failed to send email", error: error.message });
    }

    const userWithRoles = await User.findOne({
      where: { user_id: user.user_id },
      include: {
        model: Role,
        as: "roles",
        attributes: ["role_id", "name"],
      },
    });

    // Attach OBS URLs to the newly created user
    const userWithUrls = await attachObsUrlsToUser(userWithRoles);

    res.status(201).json(userWithUrls);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Unique Constraint Error",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllUsers = [
  paginationMiddleware,
  async (req, res) => {
    try {
      const { page, limit, offset } = req.pagination;
      const search = req.query.search || "";

      const whereClause = search
        ? {
          [Op.or]: [
            { full_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
          ],
        }
        : {};
      const users = await User.findAll({
        where: whereClause,
        include: {
          model: Role,
          as: "roles",
          attributes: ["role_id", "name"],
        },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      // Attach OBS URLs to each user in the list
      const usersWithUrls = await Promise.all(
        users.map(user => attachObsUrlsToUser(user))
      );

      const totalUsers = await User.count();
      const totalPages = Math.ceil(totalUsers / limit);
      res.status(200).json({
        users: usersWithUrls, // Send users with URLs
        pagination: {
          totalUsers,
          totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: {
        model: Role,
        as: "roles",
        attributes: ["role_id", "name"],
      },
    });

    if (user) {
      // Attach OBS URLs to the single user
      const userWithUrls = await attachObsUrlsToUser(user);
      res.status(200).json(userWithUrls);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsersByTeamId = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const user = await User.findOne({
      where: { user_id: userId },
      include: [
        {
          model: Team,
        },
      ],
    });

    if (!user || !user.Team) {
      return res.status(404).json({ error: "Team not found for this user." });
    }

    const teamId = user.Team.team_id;

    const users = await User.findAll({
      where: { team_id: teamId },
    });

    if (!users) {
      return res.status(404).json({ error: "No users found" });
    }

    // Attach OBS URLs to each user in the list
    const usersWithUrls = await Promise.all(
      users.map(user => attachObsUrlsToUser(user))
    );

    res.status(200).json(usersWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsersByDepartmentId = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    

    const user = await User.findOne({
      where: { user_id: userId },
      include: [
        {
          model: Department,
          as: "department",
        },
      ],
    });

    if (!user || !user.department) {
      return res
        .status(404)
        .json({ error: "Department not found for this user." });
    }

    const departmentId = user.department.department_id;

    if (!departmentId) {
      return res.status(400).json({ error: "department_id is required." });
    }

    const users = await User.findAll({
      where: { department_id: departmentId },
    });

   

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found in this department." });
    }

    // Attach OBS URLs to each user in the list
    const usersWithUrls = await Promise.all(
      users.map(user => attachObsUrlsToUser(user))
    );

    return res.status(200).json(usersWithUrls);
  } catch (error) {
    console.error("Error fetching users by department:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching the users." });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["role_id", "name"],
        },
      ],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach OBS URLs to the user profile
    const userWithUrls = await attachObsUrlsToUser(user);

    res.status(200).json(userWithUrls);
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { current_password, password, confirm_password, first_name, middle_name, last_name } = req.body;
    const user_id = req.user.id;
    const updateFields = {};

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (password) {
      if (password !== confirm_password) {
        return res.status(400).json({ message: "Password and confirm password do not match." });
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    if (first_name || middle_name || last_name) {
      updateFields.full_name = [first_name, middle_name, last_name].filter(Boolean).join(" ");
    }

    // Note: Your original code had req.file for profile_picture,
    // but the OBS upload logic is for signature/titer.
    // If profile_picture also goes to OBS, you'd need similar uploadToOBS logic here.
    if (req.file) {
      updateFields.profile_picture = path.normalize(req.file.path);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const [updated] = await User.update(updateFields, {
      where: { user_id: user_id },
    });

    if (updated) {
      const updatedUser = await User.findByPk(user_id);
      // Attach OBS URLs to the updated user
      const userWithUrls = await attachObsUrlsToUser(updatedUser);
      res.status(200).json(userWithUrls);
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { email, first_name, middle_name, last_name, role_ids, gender } = req.body;
    const userId = req.params.id;

    let full_name = "";
    if (first_name || middle_name || last_name) {
      full_name = [first_name, middle_name, last_name].filter(Boolean).join(" ");
    }

    const existingUser = await User.findByPk(userId, {
      include: {
        model: Role,
        as: "roles",
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

   
    // OBS/S3 upload logic for signature and titer
    let signature = existingUser.signature;
    let titer = existingUser.titer;

    if (req.files?.signature?.[0]) {
      const file = req.files.signature[0];
      const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
      const objectKey = `signatures/${uniqueName}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      try {
        await obsClient.send(command);
        signature = objectKey;
      } catch (err) {
        console.error("OBS Upload Error (signature):", err);
        if (err.name === "InvalidEndpoint" || err.code === "ERR_INVALID_URL") {
          return res.status(500).json({
            message: "Invalid OBS endpoint configuration. Please check OBS_ENDPOINT in .env.",
            error: err.message,
          });
        }
        return res.status(500).json({ message: "Failed to upload signature file", error: err.message });
      }
    }

    if (req.files?.titer?.[0]) {
      const file = req.files.titer[0];
      const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
      const objectKey = `titers/${uniqueName}`;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      try {
        await obsClient.send(command);
        titer = objectKey;
      } catch (err) {
        console.error("OBS Upload Error (titer):", err);
        if (err.name === "InvalidEndpoint" || err.code === "ERR_INVALID_URL") {
          return res.status(500).json({
            message: "Invalid OBS endpoint configuration. Please check OBS_ENDPOINT in .env.",
            error: err.message,
          });
        }
        return res.status(500).json({ message: "Failed to upload titer file", error: err.message });
      }
    }

    const updatedUserData = {
      email: email || existingUser.email,
      full_name: full_name || existingUser.full_name,
      gender: gender || existingUser.gender,
      signature: signature || existingUser.signature,
      titer: titer || existingUser.titer,
    };

    const [updated] = await User.update(updatedUserData, {
      where: { user_id: userId },
    });

    if (updated) {
      if (Array.isArray(role_ids) && role_ids.length > 0) {
        const roles = await Role.findAll({
          where: {
            role_id: role_ids,
          },
        });

        if (roles.length !== role_ids.length) {
          return res.status(400).json({
            message: "Some of the provided role IDs are invalid or do not exist.",
          });
        }
        await UserHasRole.destroy({ where: { user_id: userId } });

        const userRolePromises = roles.map((role) => {
          const user_role_id = uuidv4();
          return UserHasRole.create({
            user_role_id,
            user_id: userId,
            role_id: role.role_id,
          });
        });

        await Promise.all(userRolePromises);

        console.log(
          `Roles updated for User ID ${userId}: ${roles.map((role) => role.name).join(", ")}`
        );
      }

      const updatedUser = await User.findByPk(userId, {
        include: {
          model: Role,
          as: "roles",
          attributes: ["role_id", "name"],
        },
      });

      // Attach OBS URLs to the updated user
      const userWithUrls = await attachObsUrlsToUser(updatedUser);

      res.status(200).json(userWithUrls);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Unique Constraint Error",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateUserStatus = async (req, res) => {
  const { status } = req.body;

  if (typeof status !== "boolean") {
    return res.status(400).json({
      message: "Invalid status. Status must be a boolean value (true or false).",
    });
  }

  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.account_status = status;
    await user.save();

    // Attach OBS URLs to the user before sending response
    const userWithUrls = await attachObsUrlsToUser(user);

    res.status(200).json({
      message: `User status updated successfully`,
      user: {
        user_id: userWithUrls.user_id,
        full_name: userWithUrls.full_name,
        email: userWithUrls.email,
        account_status: userWithUrls.account_status,
        signatureUrl: userWithUrls.signatureUrl, // Include URLs in the response
        titerUrl: userWithUrls.titerUrl,
      },
    });
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    res.status(500).json({
      message: "Error updating user status",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { user_id: req.params.id },
    });
    if (deleted) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignDepartmentToUser = async (req, res) => {
  const { userId, departmentId, teamId } = req.body;

  if (!userId || !departmentId) {
    return res
      .status(400)
      .json({ error: "Both userId and departmentId are required" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    let team = null;
    if (teamId) {
      team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
    }

    user.department_id = departmentId;
    if (teamId) {
      user.team_id = teamId;
    }
    user.updatedAt = new Date();
    await user.save();

    // Attach OBS URLs to the user before sending response
    const userWithUrls = await attachObsUrlsToUser(user);

    return res.status(200).json({
      message: "User assigned to department successfully",
      user: userWithUrls,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while assigning the department" });
  }
};

const removeUserFromDepartment = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId, {
      include: {
        model: Role,
        as: "roles",
        attributes: ["role_id", "name"],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.department_id = null;
    await user.save();

    res
      .status(200)
      .json({ message: "User removed from department successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignRoleToUser = async (req, res) => {
  const { userId, roleId } = req.body;
  const user_role_id = uuidv4();

  if (!userId || !roleId) {
    return res.status(404).json({ error: "userId or roleId not found" });
  }

  try {
    await UserHasRole.create({
      user_id: userId,
      role_id: roleId,
      user_role_id,
    });

    res.status(201).json({ message: "Role assigned to user successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeRoleFromUser = async (req, res) => {
  const { userId, roleId } = req.body;

  if (!userId || !roleId) {
    return res.status(404).json({ error: "userId or roleId not found" });
  }

  try {
    await UserHasRole.destroy({ where: { user_id: userId, role_id: roleId } });

    res.status(200).json({ message: "Role removed from user successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove role from user" });
  }
};

const unassignDepartmentAndTeamFromUser = async (req, res) => {
  const { userId } = req.params;
  const { unassignDepartment = true, unassignTeam = true } = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (unassignDepartment && !user.department_id && unassignTeam && !user.team_id) {
      return res.status(400).json({ error: "User is not assigned to any department or team" });
    }

    if (unassignDepartment && !user.department_id) {
      return res.status(400).json({ error: "User is not assigned to a department" });
    }

    if (unassignTeam && !user.team_id) {
      return res.status(400).json({ error: "User is not assigned to a team" });
    }

    if (unassignDepartment) {
      user.department_id = null;
    }

    if (unassignTeam) {
      user.team_id = null;
    }

    await user.save();

    const userWithUrls = await attachObsUrlsToUser(user);

    return res.status(200).json({
      message: "User unassigned from department/team successfully",
      user: userWithUrls,
    });
  } catch (error) {
    console.error("Error in unassignDepartmentAndTeamFromUser:", error);
    return res.status(500).json({ error: "Failed to unassign user" });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUsersByTeamId,
  updateUser,
  updateUserStatus,
  deleteUser,
  assignDepartmentToUser,
  removeUserFromDepartment,
  assignRoleToUser,
  removeRoleFromUser,
  getUserProfile,
  updateUserProfile,
  getUsersByDepartmentId,
  unassignDepartmentAndTeamFromUser
};
