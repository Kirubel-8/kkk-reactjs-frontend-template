"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ComplaintEvidence extends Model {}
  
  ComplaintEvidence.init(
    {
      complaint_evidence_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Complaint",
          key: "complaint_id",
        },
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
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "CustomerAccount",
          key: "customer_id",
        },
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      rejection_reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ComplaintEvidence",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ComplaintEvidence.associate = (models) => {
    ComplaintEvidence.belongsTo(models.Complaint, {
      foreignKey: "complaint_id",
      as: "complaint",
    });
    ComplaintEvidence.belongsTo(models.User, {
      foreignKey: "uploaded_by",
      as: "uploader",
    });
  };

  return ComplaintEvidence;
};
