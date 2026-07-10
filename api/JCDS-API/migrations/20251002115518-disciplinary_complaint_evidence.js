"use strict";
const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
module.exports = {
    up: async(queryInterface, Sequelize) => {
        await queryInterface.createTable("DisciplinaryComplaintEvidence", {
            evidence_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuidv4(),
                allowNull: false,
            },
            disciplinary_complaint_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "DisciplinaryComplaints", // references parent table
                    key: "disciplinary_complaint_id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            file_url: {
                type: DataTypes.STRING,
                allowNull: true, 
            },
            file_status: {
                type: DataTypes.ENUM("pending", "rejected", "verified"),
                allowNull: false,
                defaultValue: "pending",
            },
            rejection_reason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
    },

    down: async(queryInterface, Sequelize) => {
        await queryInterface.dropTable("DisciplinaryComplaintEvidence");
    },
};