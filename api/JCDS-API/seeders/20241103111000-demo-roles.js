'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const rolesToSeed = [
      {
        name: 'Admin',
        description: 'Administrator role with full access',
      },
      {
        name: 'Super Admin',
        description: 'Super administrator with system-wide control',
      },
    ];

    for (const role of rolesToSeed) {
      const existingRole = await queryInterface.sequelize.query(
        `SELECT name FROM "Roles" WHERE name = :name`,
        {
          replacements: { name: role.name },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (existingRole.length === 0) {
        await queryInterface.bulkInsert('Roles', [
          {
            role_id: uuidv4(),
            name: role.name,
            description: role.description,
            createdAt: new Date(),
            updatedAt: new Date(),
            created_by: 'system',
            updated_by: 'system',
          },
        ]);

        console.log(`${role.name} role inserted successfully.`);
      } else {
        console.log(`${role.name} role already exists, skipping insertion.`);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      'Roles',
      { name: ['Admin', 'Super Admin'] },
      {}
    );
  },
};
