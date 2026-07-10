"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get Super Admin role
    const roles = await queryInterface.sequelize.query(
      `SELECT role_id FROM "Roles" WHERE name = 'Super Admin';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleId = roles[0]?.role_id;
    if (!roleId) {
      throw new Error("Super Admin role not found.");
    }

    const permissions = await queryInterface.sequelize.query(
      `SELECT permission_id FROM "Permissions"
       WHERE resource IN ('user', 'role', 'department', 'team', 'region', 'zone', 'woreda');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (permissions.length === 0) {
      throw new Error("No permissions found.");
    }

    const existing = await queryInterface.sequelize.query(
      `SELECT permission_id FROM "RoleHasPermissions"
       WHERE role_id = :roleId`,
      {
        replacements: { roleId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    const existingPermissionIds = new Set(
      existing.map((e) => e.permission_id)
    );

    //Insert ONLY missing permissions
    const roleHasPermissions = permissions
      .filter((p) => !existingPermissionIds.has(p.permission_id))
      .map((p) => ({
        role_has_permission_id: uuidv4(),
        role_id: roleId,
        permission_id: p.permission_id,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "system",
        updated_by: "system",
      }));

    if (roleHasPermissions.length > 0) {
      await queryInterface.bulkInsert(
        "RoleHasPermissions",
        roleHasPermissions
      );
      console.log("Missing permissions added successfully.");
    } else {
      console.log("No new permissions to add.");
    }
  },

  down: async () => {
    // NEVER delete permissions in down()
  },
};
