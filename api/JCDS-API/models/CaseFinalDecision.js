"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CaseFinalDecision extends Model {}

  CaseFinalDecision.init(
    {
      final_decision_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Case",
          key: "case_id",
        },
      },
      decision_status_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "StatusWithAgenda",
          key: "status_id",
        },
      },
      decision_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_members: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      decision_summary: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      final_decision_document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      calculated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "CaseFinalDecision",
      tableName: "case_final_decisions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CaseFinalDecision.associate = (models) => {
    CaseFinalDecision.belongsTo(models.Case, {
      foreignKey: "case_id",
      as: "case",
    });
    CaseFinalDecision.belongsTo(models.StatusWithAgenda, {
      foreignKey: "decision_status_id",
      as: "decisionStatus",
    });
  };

  return CaseFinalDecision;
};
