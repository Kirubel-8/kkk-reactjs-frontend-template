"use strict";
const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("DisciplinaryComplaints", {
      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuidv4(), // Generates UUID for PostgreSQL/MySQL
        allowNull: false,
      },
      applicant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "CustomerAccounts", // referenced table
          key: "customer_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      judge_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      court_office: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      court_office_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "CourtOffices",
          key: "court_office_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      file_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      signature_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      get_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      director_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      court_office_document_request_status: {
        type: DataTypes.ENUM("none", "pending", "fulfilled", "returned_empty"),
        allowNull: false,
        defaultValue: "none",
      },
      court_office_request_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      court_office_requested_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("DisciplinaryComplaints");
  },
};
