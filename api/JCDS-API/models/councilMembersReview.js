"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CouncilMembersReview extends Model {}

  CouncilMembersReview.init(
    {
      council_members_review_id: {
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
      council_head_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "User",
          key: "user_id",
        },
      },
      council_member_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "User",
          key: "user_id",
        },
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_eligable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "StatusWithAgenda",
          key: "status_id",
        },
      },
      decision: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      decision_document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CouncilMembersReview",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CouncilMembersReview.associate = (models) => {
    CouncilMembersReview.belongsTo(models.Case, {
      foreignKey: "case_id",
      as: "case",
    });
    CouncilMembersReview.belongsTo(models.User, {
      foreignKey: "council_head_id",
      as: "councilHead",
    });
    CouncilMembersReview.belongsTo(models.User, {
      foreignKey: "council_member_id",
      as: "councilMember",
    });
    CouncilMembersReview.belongsTo(models.StatusWithAgenda, {
      foreignKey: "status_id",
      as: "decisionStatus",
    });
  };

  return CouncilMembersReview;
};
