'use strict';

const { v4: uuidv4 } = require('uuid');

const users = [
  { full_name: "Admin User One", email: "admin@admin.com" },
  { full_name: "Super Admin User", email: "admin@superadmin.com" },
  { full_name: "Complaint Office Main", email: "office@complaint.com" },
  { full_name: "Council Main Member", email: "maincouncil@complaint.com" },
  { full_name: "Council Member One", email: "council_1@complaint.com" },
  { full_name: "Council Member Two", email: "council_2@complaint.com" },
  { full_name: "Council Member Three", email: "council_3@complaint.com" },
  { full_name: "Committee One Head", email: "committeehead1@disp.com" },
  { full_name: "Committee Two Head", email: "committeehead2@disp.com" },
  { full_name: "Committee Member One", email: "committee_member1@disp.com" },
  { full_name: "Committee Member Two", email: "committee_member2@disp.com" },
  { full_name: "Committee Member Three", email: "committee_member11@disp.com" },
  { full_name: "Committee Member Four", email: "committee_member22@disp.com" },
  { full_name: "Council Office Head", email: "office_disphead@disp.com" },
  { full_name: "Judicial Expert Lead", email: "judicialexpert@disp.com" },
  { full_name: "Judicial Investigation Director", email: "judicialdirector@disp.com" },
  { full_name: "Judicial File Organizer", email: "fileorganizer@disp.com" },
  { full_name: "Disp Council One", email: "council_1@disp.com" },
  { full_name: "Disp Council Two", email: "council_2@disp.com" },
  { full_name: "Disp Council Three", email: "council_4@disp.com" },
  { full_name: "Disp Council Four", email: "council_5@disp.com" },
  { full_name: "Disp Council Five", email: "council_6@disp.com" },
  { full_name: "Disp Council Six", email: "council_7@disp.com" },
  { full_name: "Court Office FileOrg", email: "courtoffice@disp.com" },
  { full_name: "Court Office two", email: "courtoffice2@disp.com" },
  { full_name: "Federal Police User", email: "fpuser@complaint.com" },
  { full_name: "Judge user com", email: "judgeuser@complaint.com" },
  { full_name: "Judge user disp", email: "judgeuser1@disp.com" },
  { full_name: "test disp test", email: "testuser@disp.com" },
  { full_name: "test comp test", email: "testuser@complaint.com" },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Find existing users to skip duplicates
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT email FROM "Users" WHERE email IN (:emails)`,
      {
        replacements: { emails: users.map(u => u.email) },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    const existingEmails = existingUsers.map(u => u.email);

    const usersToInsert = users
      .filter(u => !existingEmails.includes(u.email))
      .map(u => ({
        user_id: uuidv4(),
        full_name: u.full_name,
        img_url: null,
        gender: "male",
        email: u.email,
        password: "$2a$10$j2CE2yszJk9yUci.43YTeuwTSeQUKYxnsae0XKYUG/0JM9y5.Mel2", // Admin@123
        department_id: null,
        refreshToken: null,
        account_status: true,
        created_by: "system",
        updated_by: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('Users', usersToInsert);
      console.log(`Inserted ${usersToInsert.length} new users.`);
    } else {
      console.log('No new users to insert, all already exist.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const emails = users.map(u => u.email);

    await queryInterface.bulkDelete(
      'Users',
      { email: { [Sequelize.Op.in]: emails } },
      {}
    );

    console.log('Demo users deleted successfully.');
  },
};
