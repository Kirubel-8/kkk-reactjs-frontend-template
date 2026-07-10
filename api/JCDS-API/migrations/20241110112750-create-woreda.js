'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the table already exists
    const tableList = await queryInterface.showAllTables();
    if (!tableList.includes('Woredas')) {
      // Create the table with all required columns
      await queryInterface.createTable('Woredas', {
        woreda_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
        },
        subcity_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Subcities',
            key: 'subcity_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        zone_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Zones',
            key: 'zone_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
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
    } else {
      // Table exists — ensure columns exist without failing
      const tableDesc = await queryInterface.describeTable('Woredas');

      if (!tableDesc.subcity_id) {
        await queryInterface.addColumn('Woredas', 'subcity_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Subcities',
            key: 'subcity_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        });
      }

      if (!tableDesc.zone_id) {
        await queryInterface.addColumn('Woredas', 'zone_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Zones',
            key: 'zone_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table if it exists
    const tableList = await queryInterface.showAllTables();
    if (tableList.includes('Woredas')) {
      await queryInterface.dropTable('Woredas');
    }
  },
};
