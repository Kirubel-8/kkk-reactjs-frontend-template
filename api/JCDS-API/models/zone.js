"use strict";
const { Model, DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");


module.exports = (sequelize) => {
    class Zone extends Model { }

    Zone.init(
        {
            zone_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: uuidv4(),
            },
            region_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "Region",
                    key: "region_id",
                },
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
            modelName: "Zone",
            timestamps: false,
        }
    );

    Zone.associate = (models) => {
        Zone.belongsTo(models.Region, { foreignKey: "region_id" });
        Zone.hasMany(models.Woreda, { foreignKey: "zone_id" });
    };

    return Zone;
};
