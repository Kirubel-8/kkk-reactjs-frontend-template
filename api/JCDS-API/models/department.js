"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Department extends Model {}

  Department.init(
    {
      department_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
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
      modelName: "Department",
      timestamps: false,
    }
  );

  Department.associate = (models) => {
    Department.hasMany(models.User, {
      foreignKey: "department_id",
      as: 'users',
  });
    // Link departments to cases where a department acts as the assigned committee
    Department.hasMany(models.Case, {
      foreignKey: 'assigned_committee',
      as: 'assigned_committee_ref'
    });
  };

  return Department;
};
