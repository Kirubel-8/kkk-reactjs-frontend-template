"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Complaints table
    await queryInterface.createTable("Complaints", {
      complaint_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuidv4(),
      },
      applicant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "CustomerAccounts",
          key: "customer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      complainant_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      judge_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      judge_court: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      case_file_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      case_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      act_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      detailed_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      damage_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      additional_explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submission_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      
      status: {
        type: DataTypes.ENUM(
          "pending",
          "rejected",
          "under_investigation",
          "accepted",
          "under_council_review",
          "Decided",
          "returned",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      get_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
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

    // ComplaintEvidences table
    await queryInterface.createTable("ComplaintEvidences", {
      complaint_evidence_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuidv4(),
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Complaints",
          key: "complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      file_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "uploaded",
      },
      rejection_reason: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Reason for rejecting the evidence file",
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "CustomerAccounts",
          key: "customer_id",
        },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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

    await queryInterface.createTable("ComplaintWitnesses", {
      complaint_witness_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuidv4(),
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Complaints",
          key: "complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      disciplinary_id:{
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      witness_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      witness_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      witness_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      witness_signature: {
        type: DataTypes.STRING,
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
    await queryInterface.dropTable("ComplaintWitnesses");
    await queryInterface.dropTable("ComplaintEvidences");
    await queryInterface.dropTable("Complaints");
  },
};
