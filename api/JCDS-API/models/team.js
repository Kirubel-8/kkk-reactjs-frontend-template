"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Team extends Model {}

  Team.init(
    {
      team_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      case_type_id: {
        type: DataTypes.UUID,
        references: {
          model: "CaseType",
          key: "case_type_id",
        },
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
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
      modelName: "Team",
      tableName: "Teams",
      timestamps: false,
    }
  );

  Team.associate = (models) => {
    Team.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });
    Team.hasMany(models.User, { foreignKey: "team_id" });

    // Team.belongsToMany(models.CaseType, {
    //   through: models.CaseHasType,
    //   foreignKey: "team_id",
    //   otherKey: "case_type_id",
    //   as: "caseTypes",
    // });

    Team.belongsTo(models.CaseType, {
      foreignKey: "case_type_id",
      as: "caseType",
    });
    
  };

  return Team;
};
