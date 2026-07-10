"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const [user] = await queryInterface.sequelize.query(
      `SELECT user_id FROM "Users" WHERE email = 'admin@superadmin.com'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const [role] = await queryInterface.sequelize.query(
      `SELECT role_id FROM "Roles" WHERE name = 'Super Admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!user || !role) {
      console.log("Super Admin user or role not found. Skipping seeder.");
      return;
    }

    const existing = await queryInterface.sequelize.query(
      `SELECT 1 FROM "UserHasRoles"
       WHERE user_id = :userId AND role_id = :roleId`,
      {
        replacements: {
          userId: user.user_id,
          roleId: role.role_id,
        },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) {
      console.log("Super Admin role already assigned to user. Skipping.");
      return;
    }

    await queryInterface.bulkInsert("UserHasRoles", [
      {
        user_role_id: uuidv4(),
        user_id: user.user_id,
        role_id: role.role_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("Super Admin role assigned successfully.");
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `
      DELETE FROM "UserHasRoles"
      WHERE user_id IN (
        SELECT user_id FROM "Users" WHERE email = 'admin@superadmin.com'
      )
      AND role_id IN (
        SELECT role_id FROM "Roles" WHERE name = 'Super Admin'
      )
      `
    );

    console.log("Super Admin role assignment removed.");
  },
};
