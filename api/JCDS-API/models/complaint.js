"use strict";
const { Model, DataTypes } = require("sequelize");

const statusValues = [
  "pending",
  "rejected",
  "under_investigation",
  "accepted",
  "under_council_review",
  "Decided",
  "returned",
];

module.exports.statusValues = statusValues;

module.exports = (sequelize) => {
  class Complaint extends Model {}
  
  Complaint.init(
    {
      complaint_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      applicant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "CustomerAccount",
          key: "customer_id",
        },
      },
      complainant_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      judge_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      judge_court: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      case_file_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      case_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      act_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      detailed_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      damage_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      additional_explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submission_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(statusValues),
        allowNull: false,
        defaultValue: "pending",
      },
      get_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "User",
          key: "user_id",
        },
      },
      court_office_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "CourtOffice",
          key: "court_office_id",
        },
      },
    },
    {
      sequelize,
      modelName: "Complaint",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Complaint.associate = (models) => {
    Complaint.belongsTo(models.CustomerAccount, {
      foreignKey: "applicant_id",
      as: "applicant",
    });
    Complaint.belongsTo(models.User, {
      foreignKey: "get_user_id",
      as: "assignedUser",
    });
    Complaint.hasOne(models.Case, {
      foreignKey: "complaint_id",
      as: "case",
    });
    Complaint.hasMany(models.ComplaintWitness, {
      foreignKey: "complaint_id",
      as: "witnesses",
    });
    Complaint.hasMany(models.ComplaintEvidence, {
      foreignKey: "complaint_id",
      as: "evidences",
    });
    Complaint.hasMany(models.ComplaintDepartmentReview, {
      foreignKey: "complaint_id",
      as: "departmentReviews",
    });
    Complaint.hasMany(models.Notification, {
      foreignKey: "complaint_id",
      as: "notifications",
    });
    Complaint.hasMany(models.ComplaintHasRejection, {
      foreignKey: "complaint_id",
      as: "complaintRejection",
    });
    Complaint.belongsTo(models.CourtOffice, {
      foreignKey: "court_office_id",
      as: "courtOffice",
    });    
  };

  return Complaint;
};
