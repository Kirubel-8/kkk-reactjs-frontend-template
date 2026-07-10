const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ComplaintEvidenceHasRejections', {
     complaint_rejection_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      disciplinary_evidence_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaintEvidence",
          key: "evidence_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      complaint_evidence_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "ComplaintEvidences",
          key: "complaint_evidence_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ComplaintEvidenceHasRejections');
  }
};