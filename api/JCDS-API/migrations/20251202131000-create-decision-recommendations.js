"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  /**
   * Creates the decision_recommendations table to match the DecisionRecommendation model.
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("decision_recommendations", {
      decision_recommendation_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      status_with_agenda_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "status_with_agendas",
          key: "status_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  /**
   * Drops the decision_recommendations table.
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("decision_recommendations");
  },
};



