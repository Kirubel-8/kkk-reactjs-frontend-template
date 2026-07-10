"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
	class CaseDecisionLetter extends Model {
		static associate(models) {
			CaseDecisionLetter.belongsTo(models.CaseDecision, {
				foreignKey: "case_decision_id",
				as: "decision",
			});
			CaseDecisionLetter.belongsTo(models.User, {
				foreignKey: "created_by",
				as: "creator",
			});
		}
	}

	CaseDecisionLetter.init(
		{
			decision_letter_id: {
				type: DataTypes.UUID,
				primaryKey: true,
				defaultValue: DataTypes.UUIDV4,
			},
			case_decision_id: {
				type: DataTypes.UUID,
				allowNull: false,
				references: {
					model: "case_decision",
					key: "decision_id",
				},
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
			},
		},
		{
			sequelize,
			modelName: "CaseDecisionLetter",
			tableName: "case_decision_letters",
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
		}
	);

	return CaseDecisionLetter;
};
