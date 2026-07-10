"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CommitteeMembersReview extends Model {
    static associate(models) {
      CommitteeMembersReview.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });
      CommitteeMembersReview.belongsTo(models.User, {
        foreignKey: "committee_head_id",
        as: "committeeHead",
      });
      CommitteeMembersReview.belongsTo(models.StatusWithAgenda, {
        foreignKey: "interim_decision_id",
        as: "interimDecision",
      });
    }
  }

  CommitteeMembersReview.init(
    {
      committe_members_review_id: {
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
      committee_head_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "User",
          key: "user_id",
        },
      },
      interim_decision_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "StatusWithAgenda",
          key: "status_id",
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_once: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CommitteeMembersReview",
      tableName: "committee_members_reviews",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CommitteeMembersReview;
};

