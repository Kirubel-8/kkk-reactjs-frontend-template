"use strict";
const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CaseAttachments", {
       case_attachment_id: {
             type: DataTypes.UUID,
             defaultValue: uuidv4(),
             primaryKey: true,
             allowNull: false,
      },
      case_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "cases",
          key: "case_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      disciplinary_complaint_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      file_status: {
        type: Sequelize.ENUM("pending", "approved", "returned"),
        allowNull: false,
        defaultValue: "pending",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("CaseAttachments");
  },
};
