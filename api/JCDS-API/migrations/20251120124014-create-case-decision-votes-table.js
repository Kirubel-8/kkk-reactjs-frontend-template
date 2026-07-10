"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("case_decision_votes", {
      case_decision_vote_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuidv4(),
        allowNull: false,
      },

      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "cases",
          key: "case_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      council_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "user_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      assigned_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      status_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "status_with_agendas",
          key: "status_id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      is_voted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      vote_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
    await queryInterface.dropTable("case_decision_votes");
  },
};
