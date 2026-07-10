"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CaseDecisionVotes extends Model {
    static associate(models) {
      CaseDecisionVotes.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });
      CaseDecisionVotes.belongsTo(models.User, {
        foreignKey: "council_user_id",
        as: "councilMember",
      });
      CaseDecisionVotes.belongsTo(models.StatusWithAgenda, {
        foreignKey: "status_id",
        as: "decisionStatus",
      });
    }
  }

  CaseDecisionVotes.init(
    {
      case_decision_vote_id: {
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
      council_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "status_with_agendas",
          key: "status_id",
        },
      },
      assigned_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_voted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vote_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CaseDecisionVotes",
      tableName: "case_decision_votes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CaseDecisionVotes;
};
