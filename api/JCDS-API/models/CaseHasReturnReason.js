"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CaseHasReturnReason extends Model {
    static associate(models) {
      this.belongsTo(models.DisciplinaryComplaint, {
        foreignKey: "disciplinary_complaint_id",
        as: "disciplinaryComplaint",
      });
      this.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });
      this.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });
      this.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "createdByUser",
      });
      this.belongsTo(models.User, {
        foreignKey: "updated_by",
        as: "updatedByUser",
      });  
      this.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "returnCase",
      });
    }
  }

  CaseHasReturnReason.init(
    {
      complaint_return_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      return_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
          type: DataTypes.UUID,
          allowNull: true,
      },    
    },
    {
      sequelize,
      modelName: "CaseHasReturnReason",
      tableName: "CaseHasReturnReasons",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return CaseHasReturnReason;
};
