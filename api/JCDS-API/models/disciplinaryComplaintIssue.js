"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class DisciplinaryComplaintIssue extends Model {
        static associate(models) {
            this.belongsTo(models.DisciplinaryComplaint, {
                foreignKey: "disciplinary_complaint_id",
                as: "complaint",
            });
        }
    }

    DisciplinaryComplaintIssue.init({
        issue_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        disciplinary_complaint_id: { type: DataTypes.UUID, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
    }, {
        sequelize,
        modelName: "DisciplinaryComplaintIssue",
        timestamps: true,
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    });

    return DisciplinaryComplaintIssue;
};