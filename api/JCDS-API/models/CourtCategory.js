"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CourtCategory extends Model {}
  CourtCategory.init(
    {
      court_category_id: {
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
      modelName: "CourtCategory",
      timestamps: true,
    }
  );

  CourtCategory.associate = (models) => {
    CourtCategory.hasMany(models.CourtOffice, {
      foreignKey: "court_catagory_id",
      as: "offices",
    });
  };

  return CourtCategory;
};
