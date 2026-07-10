"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cases", {
      case_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Complaints",
          key: "complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      disciplinary_complaint_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      case_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      case_type: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "CaseTypes",
          key: "case_type_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "open",
      },
      assigned_committee: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Departments",
          key: "department_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      committee_priority: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      meeting_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      get_fileorganizer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      assigned_expert: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cases");
  },
};
