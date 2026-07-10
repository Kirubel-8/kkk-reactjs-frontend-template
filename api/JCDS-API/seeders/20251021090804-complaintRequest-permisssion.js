"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      // Complaint permissions
      { action: "read", resource: "complaint" },
      { action: "can_get", resource: "complaint" },

      // Complaint case permissions
      { action: "read", resource: "complaintCase" },
      { action: "recommendDecision", resource: "complaintCase" },

      // Case Review permissions (Council Head)
      { action: "read", resource: "caseReview" },
      { action: "approve", resource: "caseReview" },
      { action: "reject", resource: "caseReview" },

      // Case Decision permissions (Council)
      { action: "read", resource: "caseDecision" },
      { action: "decide", resource: "caseDecision" },

      // Complaint Letter Generation permissions
      { action: "read", resource: "complaintLetterGeneration" },
      { action: "create", resource: "complaintLetterGeneration" },
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
    //NEVER delete permissions in production
  },
};
