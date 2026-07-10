"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CourtOfficeRequest extends Model {
    static associate(models) {
      this.belongsTo(models.Case, {
        foreignKey: "case_id",
        as: "case",
      });
    }
  }

  CourtOfficeRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },

      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Cases",
          key: "case_id",
        },
        onDelete: "CASCADE",
      },

      court_office_document_request_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      court_office_request_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      court_office_requested_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      court_office_delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CourtOfficeRequest",
      timestamps: true,
    }
  );

  return CourtOfficeRequest;
};
