"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ComplaintHasRejection extends Model {
    static associate(models) {
      this.belongsTo(models.DisciplinaryComplaint, {
        foreignKey: "disciplinary_complaint_id",
        as: "disciplinaryComplaint",
      });
      this.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });
      this.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "createdByUser",
      });
      this.belongsTo(models.User, {
        foreignKey: "updated_by",
        as: "updatedByUser",
      });
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      this.belongsTo(models.CustomerAccount, {
        foreignKey: "customer_id",
        as: "customer",
      });
    }
  }

  ComplaintHasRejection.init(
    {
      complaint_rejection_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
          type: DataTypes.UUID,
          allowNull: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customer_id: {
          type: DataTypes.UUID,
          allowNull: true,
      },    
    },
    {
      sequelize,
      modelName: "ComplaintHasRejection",
      tableName: "complaintHasRejections",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return ComplaintHasRejection;
};
