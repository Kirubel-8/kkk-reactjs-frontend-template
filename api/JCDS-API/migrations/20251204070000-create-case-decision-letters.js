"use strict";

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("case_decision_letters", {
			decision_letter_id: {
				type: DataTypes.UUID,
				primaryKey: true,
				defaultValue: uuidv4(),
				allowNull: false,
			},
			case_decision_id: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: "case_decision",
					key: "decision_id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			letter_type: {
				type: DataTypes.STRING,
				allowNull: false,
				comment: "Type of letter: complainant, judge, council, etc.",
			},
			letter_content: {
				type: DataTypes.TEXT,
				allowNull: true,
				comment: "Edited letter HTML content",
			},
			file_path: {
				type: DataTypes.STRING,
				allowNull: true,
				comment: "Path to generated PDF file",
			},
			status: {
				type: DataTypes.ENUM("draft", "final"),
				allowNull: false,
				defaultValue: "draft",
			},
			created_by: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: "Users",
					key: "user_id",
				},
				onUpdate: "CASCADE",
				onDelete: "RESTRICT",
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

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("case_decision_letters");
	},
};
