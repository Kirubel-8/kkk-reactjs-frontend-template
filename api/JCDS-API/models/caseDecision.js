"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CaseDecision extends Model {
    static associate(models) {
      CaseDecision.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });
      CaseDecision.belongsTo(models.LetterReferenceNumber, {
        foreignKey: "letter_ref_id",
        as: "letterRef",
      });
      CaseDecision.belongsTo(models.StatusWithAgenda, {
        foreignKey: "decision_status",
        as: "status",
      });
      CaseDecision.belongsTo(models.User, {
        foreignKey: "updated_by",
        as: "updatedBy",
      });
      CaseDecision.hasMany(models.CaseDecisionLetter, {
        foreignKey: "case_decision_id",
        as: "letters",
      });
    }
  }

  CaseDecision.init(
    {
      decision_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "cases",
          key: "case_id",
        },
      },
      letter_ref_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "letter_reference_numbers",
          key: "reference_id",
        },
      },
      decision_status: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "status_with_agendas",
          key: "status_id",
        },
      },
      decision_document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_decision: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_decision_document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
    },
    {
      sequelize,
      modelName: "CaseDecision",
      tableName: "case_decision",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CaseDecision;
};
