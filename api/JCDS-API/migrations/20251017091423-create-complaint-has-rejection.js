"use strict";
const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("complaintHasRejections", {
      complaint_rejection_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      disciplinary_complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaints",
          key: "disciplinary_complaint_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Complaints",
          key: "complaint_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },      
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "CustomerAccounts",
          key: "customer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("complaintHasRejections");
  },
};
