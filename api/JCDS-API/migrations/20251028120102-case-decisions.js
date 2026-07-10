"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("case_decision", {
      decision_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuidv4(),
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "cases",
          key: "case_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      letter_ref_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "LetterReferenceNumbers",
          key: "reference_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      decision_status: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "status_with_agendas",
          key: "status_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      decision_document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_decision: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_decision_document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("case_decision");
  },
};
