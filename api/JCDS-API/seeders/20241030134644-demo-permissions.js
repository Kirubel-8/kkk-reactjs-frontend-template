"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      // User
      { action: "create", resource: "user" },
      { action: "read", resource: "user" },
      { action: "update", resource: "user" },
      { action: "delete", resource: "user" },

      // Role
      { action: "create", resource: "role" },
      { action: "read", resource: "role" },
      { action: "update", resource: "role" },
      { action: "delete", resource: "role" },

      // Department
      { action: "create", resource: "department" },
      { action: "read", resource: "department" },
      { action: "update", resource: "department" },
      { action: "delete", resource: "department" },

      // Team
      { action: "create", resource: "team" },
      { action: "read", resource: "team" },
      { action: "update", resource: "team" },
      { action: "delete", resource: "team" },

      // Region
      { action: "create", resource: "region" },
      { action: "read", resource: "region" },
      { action: "update", resource: "region" },
      { action: "delete", resource: "region" },

      // Zone
      { action: "create", resource: "zone" },
      { action: "read", resource: "zone" },
      { action: "update", resource: "zone" },
      { action: "delete", resource: "zone" },

      // Woreda
      { action: "create", resource: "woreda" },
      { action: "read", resource: "woreda" },
      { action: "update", resource: "woreda" },
      { action: "delete", resource: "woreda" },

      // Profile
      { action: "view", resource: "profile" },
    ];

    for (const perm of permissions) {
      const existing = await queryInterface.sequelize.query(
        `SELECT permission_id FROM "Permissions"
         WHERE action = :action AND resource = :resource`,
        {
          replacements: perm,
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert("Permissions", [
          {
            permission_id: uuidv4(),
            action: perm.action,
            resource: perm.resource,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
    }
  },

  down: async () => {
    // NEVER delete base permissions in production
  },
};
