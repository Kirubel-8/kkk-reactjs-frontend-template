"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class City extends Model {}
  City.init(
    {
      city_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "City",
      timestamps: true,
    }
  );

  City.associate = (models) => {
    City.hasMany(models.Subcity, {
      foreignKey: "city_id",
      as: "subcities",
    });
  };

  return City;
};
