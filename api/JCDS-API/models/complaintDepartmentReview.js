"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ComplaintDepartmentReview extends Model {}
  
  ComplaintDepartmentReview.init(
    {
      complaint_department_review_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Complaint",
          key: "complaint_id",
        },
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Case",
          key: "case_id",
        },
      },
      department_head_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "User",
          key: "user_id",
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ComplaintDepartmentReview",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ComplaintDepartmentReview.associate = (models) => {
    ComplaintDepartmentReview.belongsTo(models.Complaint, {
      foreignKey: "complaint_id",
      as: "complaint",
    });
    ComplaintDepartmentReview.belongsTo(models.Case, {
      foreignKey: "case_id",
      as: "case",
    });
    ComplaintDepartmentReview.belongsTo(models.User, {
      foreignKey: "department_head_id",
      as: "departmentHead",
    });
  };

  return ComplaintDepartmentReview;
};
