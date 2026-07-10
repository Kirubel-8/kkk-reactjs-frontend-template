"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class RoleHasPermission extends Model {}

  RoleHasPermission.init(
    {
      role_has_permission_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      permission_id: {
        type: DataTypes.UUID,
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
      modelName: "RoleHasPermission",
      timestamps: false,
    }
  );

  RoleHasPermission.associate = (models) => {
    RoleHasPermission.belongsTo(models.Role, { foreignKey: "role_id" });
    RoleHasPermission.belongsTo(models.Permission, {
      foreignKey: "permission_id",
    });
  };

  return RoleHasPermission;
};
