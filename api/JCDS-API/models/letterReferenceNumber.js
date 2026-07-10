"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class LetterReferenceNumber extends Model {}
  
  LetterReferenceNumber.init(
    {
      reference_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      reference_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "LetterReferenceNumber",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  LetterReferenceNumber.associate = (models) => {
    LetterReferenceNumber.hasMany(models.CaseDecision, {
      foreignKey: "letter_ref_id",
      as: "decisions",
    });
  };

  return LetterReferenceNumber;
};
