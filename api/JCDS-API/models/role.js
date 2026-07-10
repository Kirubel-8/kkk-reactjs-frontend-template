"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Role extends Model {}

  Role.init(
    {
      role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: "Role",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Role.associate = (models) => {
    Role.hasMany(models.RoleHasPermission, {
      foreignKey: "role_id",
      otherKey: "permission_id",
      as: "roleHasPermissions",
    });

    Role.hasMany(sequelize.models.UserHasRole, {
      foreignKey: "role_id",
      as: "roleUsers",
    });

    Role.belongsToMany(sequelize.models.User, {
      through: sequelize.models.UserHasRole,
      foreignKey: "role_id",
      otherKey: "user_id",
      as: "users",
    });

    Role.belongsToMany(sequelize.models.Permission, {
      through: sequelize.models.RoleHasPermission,
      foreignKey: "role_id",
      otherKey: "permission_id",
      as: "permissions",
    });
  };

  return Role;
};
