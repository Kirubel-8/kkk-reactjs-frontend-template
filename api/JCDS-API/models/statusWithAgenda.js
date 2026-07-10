"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StatusWithAgenda extends Model {
    static associate(models) {
      StatusWithAgenda.belongsTo(models.Agendas, {
        foreignKey: "agenda_id",
        as: "agenda",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      StatusWithAgenda.hasMany(models.CaseDecision, {
        foreignKey: "decision_status",
        as: "decisions",
      });
    }
  }

  StatusWithAgenda.init(
    {
      status_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      agenda_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Agendas",
          key: "agenda_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("committee", "council"),
        allowNull: true,
      },
      decision_type: {
        type: DataTypes.ENUM(
          "forward to judge",
          "forward to council office",
          "complaint closed",
          "back to committee",
          "back to council",
          "forward to committee",
          "forward to council"
        ),
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
      modelName: "StatusWithAgenda",
      tableName: "status_with_agendas",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return StatusWithAgenda;
};
