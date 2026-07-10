"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CaseHasType extends Model {}
  CaseHasType.init(
    {
      case_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      case_type_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "CaseHasType",
      // tableName: "CaseHasTypes",
      timestamps: true,
    }
  );

  return CaseHasType;
};
