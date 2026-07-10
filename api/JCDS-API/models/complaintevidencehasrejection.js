'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComplaintEvidenceHasRejection extends Model {}

  ComplaintEvidenceHasRejection.init(
    {
      complaint_rejection_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      disciplinary_evidence_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      complaint_evidence_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ComplaintEvidenceHasRejection',
      tableName: 'ComplaintEvidenceHasRejections',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return ComplaintEvidenceHasRejection;
};
