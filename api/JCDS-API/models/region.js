"use strict";
const { Model, DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

module.exports = (sequelize) => {
    class Region extends Model { }

    Region.init(
        {
            region_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: uuidv4(),
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "Region",
            timestamps: false,
        }
    );

    Region.associate = (models) => {
        Region.hasMany(models.Zone, { foreignKey: "region_id" });
    };

    return Region;
};

