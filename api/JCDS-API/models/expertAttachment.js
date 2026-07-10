"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class ExpertAttachment extends Model {
        static associate(models) {
            ExpertAttachment.belongsTo(models.Case, {
                foreignKey: "case_id",
                as: "case",
            });

            ExpertAttachment.belongsTo(models.User, {
                foreignKey: "uploaded_by",
                as: "uploader",
            });
        }
    }

    ExpertAttachment.init({
        expert_attachment_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4
        },
        case_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        document_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        document_path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        document_status: {
            type: DataTypes.ENUM('pending', 'approved', 'returned'),
            allowNull: false,
            defaultValue: 'pending',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        uploaded_by: {
            type: DataTypes.UUID,
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
    }, {
        sequelize,
        modelName: "ExpertAttachment",
        tableName: "ExpertAttachments", 
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    });

    return ExpertAttachment;
};