"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ComplaintWitness extends Model {}
  
  ComplaintWitness.init(
    {
      complaint_witness_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Complaint",
          key: "complaint_id",
        },
      },
      disciplinary_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "DisciplinaryComplaint",
          key: "disciplinary_complaint_id",
        },
      },
      witness_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      witness_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      witness_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      witness_signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ComplaintWitness",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ComplaintWitness.associate = (models) => {
    ComplaintWitness.belongsTo(models.Complaint, {
      foreignKey: "complaint_id",
      as: "complaint",
    });
    ComplaintWitness.belongsTo(models.DisciplinaryComplaint, {
      foreignKey: "disciplinary_id",
      as: "disciplinaryComplaint",
    });
  };

  return ComplaintWitness;
};
