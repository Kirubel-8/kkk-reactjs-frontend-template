"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CustomerAccount extends Model {}

  CustomerAccount.init(
    {
      customer_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      img_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetTokenExpiration: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otp_expiry: {
        type: DataTypes.DATE,
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
      modelName: "CustomerAccount",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  CustomerAccount.associate = (models) => {
    CustomerAccount.hasMany(models.Complaint, {
      foreignKey: "applicant_id",
      as: "complaints",
    });
    CustomerAccount.hasMany(models.Notification, {
      foreignKey: "recipient_customer_id",
      as: "notifications",
    });
  };

  return CustomerAccount;
};
