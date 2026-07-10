"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("CourtOfficeRequests", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuidv4(),
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
      court_office_document_request_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      court_office_request_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      court_office_requested_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      court_office_delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("CourtOfficeRequests");
  },
};
