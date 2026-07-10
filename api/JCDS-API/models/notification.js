"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      //Relationship with Case
      Notification.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });

      // Relationship with DisciplinaryComplaint
      Notification.belongsTo(models.DisciplinaryComplaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });

      // Relationship with CustomerAccount (recipient)
      Notification.belongsTo(models.CustomerAccount, {
        foreignKey: "recipient_customer_id",
        as: "recipient_customer",
      });

      // Relationship with User (recipient)
      Notification.belongsTo(models.User, {
        foreignKey: "recipient_user_id",
        as: "recipient_user",
      });

      // Relationship with User (sender)
      Notification.belongsTo(models.User, {
        foreignKey: "sender_id",
        as: "sender",
      });
    }
  }

  Notification.init(
    {
      notification_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "cases",
          key: "case_id",
        },
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
      },
      recipient_customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "CustomerAccounts",
          key: "customer_id",
        },
      },
      recipient_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
      },
      type: {
        type: DataTypes.ENUM("system", "email", "sms", "in_app"),
        allowNull: false,
        defaultValue: "system",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      modelName: "Notification",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      tableName: "notifications",
    }
  );

  return Notification;
};
