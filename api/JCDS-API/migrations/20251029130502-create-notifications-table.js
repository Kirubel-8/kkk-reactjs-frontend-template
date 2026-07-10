"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      notification_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuidv4(),
        allowNull: false,
      },
      case_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "cases",
          key: "case_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      recipient_customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "CustomerAccounts",
          key: "customer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      recipient_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      type: {
        type: Sequelize.ENUM("system", "email", "sms", "in_app"),
        allowNull: false,
        defaultValue: "system",
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("notifications");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notifications_type";'
    ); // drop ENUM type
  },
};
