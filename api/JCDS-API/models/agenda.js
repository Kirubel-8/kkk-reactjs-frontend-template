"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Agendas extends Model {
    static associate(models) {
      Agendas.hasMany(models.StatusWithAgenda, {
        foreignKey: "agenda_id",
        as: "statuses",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  Agendas.init(
    {
      agenda_id: {
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
      modelName: "Agendas",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Agendas;
};
