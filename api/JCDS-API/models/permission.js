"use strict";
const { Model, DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
// const { v4: uuidv4 } = await import('uuid');

module.exports = (sequelize) => {
  class Permission extends Model {}

  Permission.init(
    {
      permission_id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4(),
        primaryKey: true,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Permission",
      timestamps: false,
    }
  );

  Permission.associate = (models) => {
    // Permission.belongsTo(models.RoleHasPermission, {
    //   foreignKey: "permission_id",
    //   as: "permissionRoles",
    // });
    Permission.belongsToMany(models.Role, {
      through: models.RoleHasPermission,
      foreignKey: "permission_id",
      otherKey: "role_id",
      as: "role_permisssions",
    });
  };

  return Permission;
};
