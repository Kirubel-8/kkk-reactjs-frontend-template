const { User, Role, Permission } = require("../models");

/**
 * Checks if the authenticated user has the given permission (resource/action).
 * Usage: authorizePermission('JudiciaryInvestigationDirectorate', 'getDisciplinaryComplaint')
 */
const authorizePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findOne({
        where: { user_id: userId },
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
                attributes: ["action", "resource"],
              },
            ],
          },
        ],
      });

      if (!user || !user.roles || user.roles.length === 0) {
        return res.status(403).json({ message: "Access forbidden: No roles found" });
      }

      const hasPermission = user.roles.some((role) =>
        role.permissions?.some(
          (perm) => perm.resource === resource && perm.action === action
        )
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Access forbidden: Insufficient permission" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};

module.exports = { authorizePermission };


