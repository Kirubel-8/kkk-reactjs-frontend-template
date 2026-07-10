"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CaseType extends Model {}
  CaseType.init(
    {
      case_type_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },

    {
      sequelize,
      modelName: "CaseType",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CaseType.associate = (models) => {
    CaseType.belongsToMany(models.Case, {
      through: models.CaseHasType,
      foreignKey: "case_type_id",
      otherKey: "case_id",
      as: "cases",
    });

    CaseType.hasOne(models.Team, {
      foreignKey: "case_type_id",
      as: "team",
    });
  };

  return CaseType;
};
