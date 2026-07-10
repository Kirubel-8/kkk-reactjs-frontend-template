"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      // Discipline Request permissions
      { action: "read", resource: "disciplineRequest" },
      { action: "update", resource: "disciplineRequest" },
      { action: "delete", resource: "disciplineRequest" },

      // Discipline Case permissions
      { action: "read", resource: "disciplineCase" },

      // Judiciary Directorate
      // Can approve / reject disciplinary complaints directly
      { action: "reviewDisciplinaryComplaint", resource: "JudiciaryDirectorate" },

      // Judiciary Investigation Directorate / File Organizer
      { action: "read", resource: "JudiciaryInvestigationDirectorate" },
      { action: "fileOrganize", resource: "JudiciaryInvestigationDirectorate" },
      { action: "getDisciplinaryComplaint", resource: "JudiciaryInvestigationDirectorate" },

      // Court Office permissions
      { action: "viewDocumentRequests", resource: "CourtOffice" },
      { action: "uploadDocuments", resource: "CourtOffice" },

      // Department Committee permissions
      { action: "read", resource: "DepartmentCommittee" },
      { action: "write", resource: "DepartmentCommittee" },
      { action: "update", resource: "DepartmentCommittee" },

      // Additional Department Committee–specific actions
      { action: "select_case", resource: "DepartmentCommittee" },
      { action: "change_status", resource: "DepartmentCommittee" },
      { action: "change_priority", resource: "DepartmentCommittee" },
      { action: "attach_file", resource: "DepartmentCommittee" },
      { action: "inform_expert", resource: "DepartmentCommittee" },
      { action: "attach_head_file", resource: "DepartmentCommittee" },
      { action: "attach_expert_file", resource: "DepartmentCommittee" },
      { action: "view_committee_decisions", resource: "DepartmentCommittee" },

      // Committee Decided permissions
      { action: "read", resource: "CommitteeDecided" },
      { action: "write", resource: "CommitteeDecided" },
      { action: "update", resource: "CommitteeDecided" },
      { action: "assign_members", resource: "CommitteeDecided" },
      { action: "submit_decision", resource: "CommitteeDecided" },
      { action: "view_decisions", resource: "CommitteeDecided" },
      { action: "view_statistics", resource: "CommitteeDecided" },

      // Disciplinary Letter Generation permissions
      { action: "read", resource: "disciplinaryLetterGeneration" },
      { action: "create", resource: "disciplinaryLetterGeneration" },
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
    // 🚫 DO NOT delete permissions in production
    // Deleting permissions will break existing roles
  },
};
