"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UserHasRole extends Model {}

  UserHasRole.init(
    {
      user_role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Roles",
          key: "role_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "UserHasRole",
      tableName: "UserHasRoles",
      timestamps: true,
    }
  );

  // Define composite primary key
  UserHasRole.removeAttribute("id");
  UserHasRole.primaryKeyAttributes = ["user_id", "role_id"];

  return UserHasRole;
};
