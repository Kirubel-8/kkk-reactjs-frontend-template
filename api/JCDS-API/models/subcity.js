"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Subcity extends Model {}
  Subcity.init(
    {
      subcity_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city_id: {
        type: DataTypes.UUID,
        references: {
          model: "Cities", // Refers to the `Cities` table
          key: "city_id",
        },
        allowNull: false,
      },
      // created_by: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      // },
      // updated_by: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      // },
    },
    {
      sequelize,
      modelName: "Subcity",
      timestamps: true,
    }
  );
  Subcity.associate = (models) => {
    Subcity.belongsTo(models.City, {
      foreignKey: "city_id",
      as: "city",
    });
  };
  return Subcity;
};
