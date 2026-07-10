"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      {
        action: "read",
        resource: "complaintFederalOffice",
      },
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
    //Do NOT delete permissions in production
  },
};
