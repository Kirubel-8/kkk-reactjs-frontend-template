"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CaseAttachment extends Model {}

  CaseAttachment.init(
    {
      case_attachment_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: true, // Changed to true
        references: {
          model: "Case",
          key: "case_id",
        },
      },
      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaint",
          key: "disciplinary_complaint_id",
        },
      },
      file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_status: {
        type: DataTypes.ENUM("pending", "approved", "returned"),
        allowNull: false,
        defaultValue: "pending",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "User",
          key: "user_id",
        },
      },
    },
    {
      sequelize,
      modelName: "CaseAttachment",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      tableName: "CaseAttachments",
    }
  );

  CaseAttachment.associate = (models) => {
    CaseAttachment.belongsTo(models.Case, {
      foreignKey: "case_id",
      as: "case",
    });
    CaseAttachment.belongsTo(models.User, {
      foreignKey: "uploaded_by",
      as: "uploader",
    });
  };

  return CaseAttachment;
};
