"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DisciplinaryComplaint extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "get_user_id",
        as: "assignedUser",
      });
      this.belongsTo(models.User, {
        foreignKey: "director_user_id",
        as: "directorUser",
      });
      this.belongsTo(models.CustomerAccount, {
        foreignKey: "applicant_id",
        as: "applicant",
      });
      this.hasMany(models.DisciplinaryComplaintIssue, {
        foreignKey: "disciplinary_complaint_id",
        as: "issues",
      });
      this.hasMany(models.DisciplinaryComplaintEvidence, {
        foreignKey: "disciplinary_complaint_id",
        as: "evidences",
      });
      this.hasMany(models.Notification, {
        foreignKey: "complaint_id",
        as: "notifications",
      });
      this.hasOne(models.Case, {
        foreignKey: "disciplinary_complaint_id",
        as: "case",
      });
      this.hasMany(models.ComplaintHasRejection, {
        foreignKey: "disciplinary_complaint_id",
        as: "disciplinaryRejection",
      });
      this.hasMany(models.ComplaintWitness, {
        foreignKey: "disciplinary_id",
        as: "witnesses",
      });
      this.hasMany(models.CaseAttachment, {
        foreignKey: "disciplinary_complaint_id",
        as: "attachments",
      });
      this.belongsTo(models.CourtOffice, {
        foreignKey: "court_office_id",
        as: "courtOffice",
      });
    }
  }

    DisciplinaryComplaint.init({
        disciplinary_complaint_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        applicant_id: { type: DataTypes.UUID, allowNull: false },
        judge_name: { type: DataTypes.STRING, allowNull: false },
        court_office: { type: DataTypes.STRING, allowNull: false },
        court_office_id: { type: DataTypes.UUID, allowNull: true },
        file_number: { type: DataTypes.STRING, allowNull: false },
        signature_url: { type: DataTypes.STRING, allowNull: true },
        status: {
            type: DataTypes.STRING,
            validate: {
                isIn: [["pending", "rejected", "under_investigation", "accepted", "pending_director_approval", "under_council_review", "Decided", "returned"]],
            },
            defaultValue: "pending",
        },
        get_user_id: { type: DataTypes.UUID, allowNull: true },
        director_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },

  }, {
    sequelize,
    modelName: "DisciplinaryComplaint",
        timestamps: true,
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    });

  return DisciplinaryComplaint;
};
