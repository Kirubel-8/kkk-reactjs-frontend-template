"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid"); 

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("CaseTypes", {
      case_type_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuidv4(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
       created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
       },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("CaseTypes");
  },
};