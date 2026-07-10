"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CaseHasReturnReasons", {
      complaint_return_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuidv4(),
        allowNull: false,
      },

      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Complaints",
          key: "complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      case_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "cases",
          key: "case_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      return_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },      

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("CaseHasReturnReasons");
  },
};
