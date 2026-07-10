const { User, Role } = require("../models");

const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    const userId = req.user.id;
    try {
      const user = await User.findOne({
        where: { user_id: userId },
        include: [{ model: Role, as: "roles" }],
      });

      if (!user) {
        return res
          .status(403)
          .json({ message: "Access forbidden: User not found" });
      }

      const userRoles = user.roles.map((role) => role.name);

      const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access forbidden: Insufficient role" });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };
};

module.exports = {
  authorizeRoles,
};
