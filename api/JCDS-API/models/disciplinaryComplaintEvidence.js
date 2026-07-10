"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class DisciplinaryComplaintEvidence extends Model {
        static associate(models) {
            this.belongsTo(models.DisciplinaryComplaint, {
                foreignKey: "disciplinary_complaint_id",
                as: "complaint",
            });
        }
    }

    DisciplinaryComplaintEvidence.init({
        evidence_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        disciplinary_complaint_id: { type: DataTypes.UUID, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        file_url: { type: DataTypes.STRING, allowNull: true },
        file_status: {
            type: DataTypes.ENUM(
                "pending",
                "rejected",
                "verified",
            ),
            defaultValue: "pending",
        },
        rejection_reason: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    
    {
        sequelize,
        modelName: "DisciplinaryComplaintEvidence",
        timestamps: true,
        tableName: "DisciplinaryComplaintEvidence",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    });

    return DisciplinaryComplaintEvidence;
};