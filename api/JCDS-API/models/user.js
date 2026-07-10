"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class User extends Model {}

  User.init(
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      img_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      team_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetTokenExpiration: {
        type: DataTypes.BIGINT,
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
      modelName: "User",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });
    User.belongsTo(models.Team, { foreignKey: "team_id" });
    User.hasMany(models.UserHasRole, {
      foreignKey: "user_id",
      as: "userRoles",
    });

    User.belongsToMany(models.Role, {
      through: models.UserHasRole,
      foreignKey: "user_id",
      otherKey: "role_id",
      as: "roles",
    });

    User.hasMany(models.ComplaintEvidence, {
      foreignKey: "uploaded_by",
      as: "uploadedEvidences",
    });
    User.hasMany(models.CaseAttachment, {
      foreignKey: "uploaded_by",
      as: "uploadedAttachments",
    });
    User.hasMany(models.ComplaintDepartmentReview, {
      foreignKey: "department_head_id",
      as: "departmentReviews",
    });
    User.hasMany(models.CouncilMembersReview, {
      foreignKey: "council_head_id",
      as: "headReviews",
    });
    User.hasMany(models.CouncilMembersReview, {
      foreignKey: "council_member_id",
      as: "memberReviews",
    });
    User.hasMany(models.CaseDecision, {
      foreignKey: "updated_by",
      as: "decisions",
    });
    User.hasMany(models.Notification, {
      foreignKey: "recipient_user_id",
      as: "receivedNotifications",
    });
    User.hasMany(models.Notification, {
      foreignKey: "sender_id",
      as: "sentNotifications",
    });
    User.hasMany(models.Log, {
      foreignKey: "user_log_id",
      as: "logs",
    });
  };

  return User;
};
