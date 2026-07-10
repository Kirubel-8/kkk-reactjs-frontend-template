"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Log extends Model {
    static associate(models) {
      Log.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });

      Log.belongsTo(models.User, {
        foreignKey: "user_log_id",
        as: "user",
      });
    }
  }

  Log.init(
    {
      log_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "cases",
          key: "case_id",
        },
      },
      reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      user_log_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_agent: {
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
      modelName: "Log",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      tableName: "logs",
    }
  );

  return Log;
};
