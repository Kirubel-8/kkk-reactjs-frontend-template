const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class DecisionRecommendation extends Model {}

  DecisionRecommendation.init(
    {
      decision_recommendation_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "user_id",
        },
      },
      case_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Case",
          key: "case_id",
        },
      },
      status_with_agenda_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "StatusWithAgenda",
          key: "status_id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "DecisionRecommendation",
      tableName: "decision_recommendations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  DecisionRecommendation.associate = (models) => {
    DecisionRecommendation.belongsTo(models.Case, {
      foreignKey: "case_id",
      as: "case",
    });
    DecisionRecommendation.belongsTo(models.StatusWithAgenda, {
      foreignKey: "status_with_agenda_id",
      as: "status",
    });
    DecisionRecommendation.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return DecisionRecommendation;
};
