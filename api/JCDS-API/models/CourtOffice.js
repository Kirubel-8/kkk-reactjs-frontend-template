module.exports = (sequelize, DataTypes) => {
    const CourtOffice = sequelize.define("CourtOffice", {
      court_office_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      court_catagory_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
        modelName: "CourtOffice",
        timestamps: true,
      }
);
  
    CourtOffice.associate = (models) => {
      CourtOffice.belongsTo(models.CourtCategory, {
        foreignKey: "court_catagory_id",
        as: "category",
      });
      CourtOffice.hasMany(models.Complaint, {
        foreignKey: "court_office_id",
        as: "complaints",
      });
    };
  
    return CourtOffice;
  };
  