"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Case extends Model {
    static associate(models) {
      // Relationship with regular Complaint (old system)
      Case.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });

      // Relationship with DisciplinaryComplaint (new system)
      Case.belongsTo(models.DisciplinaryComplaint, {
        foreignKey: "disciplinary_complaint_id",
        as: "disciplinary_complaint",
      });

      // Relationship with CaseType
      Case.belongsTo(models.CaseType, {
        foreignKey: "case_type",
        as: "caseType",
      });

      // Relationship with Department (assigned committee)
      Case.belongsTo(models.Department, {
        foreignKey: "assigned_committee",
        as: "assigned_committee_ref",
      });

      // Old system attachments
      Case.hasMany(models.CaseAttachment, {
        foreignKey: "case_id",
        as: "attachments",
      });

      // New system expert attachments
      Case.hasMany(models.ExpertAttachment, {
        foreignKey: "case_id",
        as: "expert_attachments",
      });

      Case.hasOne(models.CaseDecision, {
        foreignKey: "case_id",
        as: "decision",
      });
      Case.hasMany(models.CaseDecisionVotes, {
        foreignKey: "case_id",
        as: "case_decision_votes",
      });

      // Notifications and Logs
      // Case.hasMany(models.Notification, {
      //   foreignKey: "case_id",
      //   as: "notifications",
      // });

      Case.hasMany(models.Log, {
        foreignKey: "case_id",
        as: "logs",
      });

      // Council Members Review
      Case.hasMany(models.CouncilMembersReview, {
        foreignKey: "case_id",
        as: "councilReviews",
      });

      // Committee Members Review
      Case.hasOne(models.CommitteeMembersReview, {
        foreignKey: "case_id",
        as: "committeeReviews",
      });

      Case.hasMany(models.CaseHasReturnReason, {
        foreignKey: "case_id",
        as: "disciplinaryCaseReturn",
      });
      Case.hasOne(models.CourtOfficeRequest, {
        foreignKey: "case_id",
        as: "courtOfficeRequest"
      });
      Case.belongsTo(models.User, {
        foreignKey: "get_fileorganizer_id",
        as: "fileOrgUser",
    });
      

      // Decision Recommendations
      Case.hasMany(models.DecisionRecommendation, {
        foreignKey: "case_id",
        as: "decisionRecommendations",
      });
    }
  }

  Case.init(
    {
      case_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Complaint",
          key: "complaint_id",
        },
      },
      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
      },
      case_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      case_type: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "CaseTypes",
          key: "case_type_id",
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "open",
      },
      get_fileorganizer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'user_id'
        }
      },
      assigned_committee: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Departments",
          key: "department_id",
        },
      },
      assigned_expert: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
      },
      committee_priority: {
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
      modelName: "Case",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      tableName: "cases",
    }
  );

  return Case;
};
