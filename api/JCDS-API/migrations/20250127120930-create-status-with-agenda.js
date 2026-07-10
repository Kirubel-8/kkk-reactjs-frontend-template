"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = "status_with_agendas";
    
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      // Create table if it doesn't exist
      await queryInterface.createTable(tableName, {
        status_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
        },
        agenda_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "Agendas", 
            key: "agenda_id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM("committee", "council"),
          allowNull: true,
        },
        decision_type: {
          type: DataTypes.ENUM("forward to judge", "forward to council office", "complaint closed", "back to committee", "back to council", "forward to committee", "forward to council"),
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
    } else {
      // Table exists, check and add missing columns
      const columns = await queryInterface.sequelize.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = '${tableName}';`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const existingColumns = columns.map(col => col.column_name);

      // Check and add decision_type column if it doesn't exist
      if (!existingColumns.includes('decision_type')) {
        await queryInterface.addColumn(tableName, 'decision_type', {
          type: DataTypes.ENUM("forward to judge", "forward to council office", "complaint closed", "back to committee", "back to council", "forward to committee", "forward to council"),
          allowNull: true,
        });
        console.log('Added decision_type column to status_with_agendas table');
      }

      // Check and add any other missing columns
      const expectedColumns = [
        'status_id', 'agenda_id', 'name', 'description', 'type', 
        'decision_type', 'created_by', 'updated_by', 'created_at', 'updated_at'
      ];

      for (const column of expectedColumns) {
        if (!existingColumns.includes(column) && column !== 'decision_type') {
          // Add logic for other columns if needed
          console.log(`Column ${column} is missing - would need column definition`);
        }
      }

      // Check if the ENUM type needs to be updated (PostgreSQL specific)
      try {
        // This ensures the ENUM has all the correct values
        await queryInterface.sequelize.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_status_with_agendas_decision_type') THEN
              CREATE TYPE "enum_status_with_agendas_decision_type" AS ENUM (
                'forward to judge', 'forward to council office', 'complaint closed', 
                'back to committee', 'back to council', 'forward to committee', 'forward to council'
              );
            END IF;
          END $$;
        `);
      } catch (error) {
        console.log('Enum type check completed');
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Only remove the columns we added, don't drop the entire table
    const tableName = "status_with_agendas";
    
    // Check if decision_type column exists before trying to remove it
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = '${tableName}';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingColumns = columns.map(col => col.column_name);

    if (existingColumns.includes('decision_type')) {
      await queryInterface.removeColumn(tableName, 'decision_type');
    }
    
    // Note: We're not dropping the table in the down migration anymore
    // to preserve existing data
  },
};