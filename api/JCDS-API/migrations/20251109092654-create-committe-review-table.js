"use strict";
const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("committee_members_reviews", {
      committe_members_review_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
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
      committee_head_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      interim_decision_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "status_with_agendas",
          key: "status_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_once: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("committee_members_reviews");
  },
};
