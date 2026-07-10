"use strict";
const { Model, DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");


module.exports = (sequelize) => {
  class Woreda extends Model { }

  Woreda.init(
    {
      woreda_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuidv4(),
      },
      zone_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Zone",
          key: "zone_id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      subcity_id: {
        type: DataTypes.UUID,
        allowNull: true,  
        references: {
          model: 'Subcities',  
          key: 'subcity_id',
        },
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
      modelName: "Woreda",
      timestamps: false,
    }
  );

  Woreda.associate = (models) => {
    Woreda.belongsTo(models.Zone, { foreignKey: "zone_id" });
    Woreda.belongsTo(models.Subcity, {
      foreignKey: 'subcity_id',
    });
  };

  return Woreda;
};
