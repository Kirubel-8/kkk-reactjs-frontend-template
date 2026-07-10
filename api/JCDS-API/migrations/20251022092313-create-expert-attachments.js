'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ExpertAttachments', {
      expert_attachment_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      case_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'case_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      document_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      document_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      document_status: {
        type: Sequelize.ENUM('pending', 'approved', 'returned'),
        allowNull: false,
        defaultValue: 'pending'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('ExpertAttachments', ['case_id']);
    await queryInterface.addIndex('ExpertAttachments', ['uploaded_by']);
    await queryInterface.addIndex('ExpertAttachments', ['document_status']);
    await queryInterface.addIndex('ExpertAttachments', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ExpertAttachments');
  }
};