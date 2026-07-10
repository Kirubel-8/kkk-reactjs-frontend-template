"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Zones", {
      zone_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      region_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Regions",
          key: "region_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Zones");
  },
};
