const { City, Subcity } = require("../models");
const { v4: uuidv4 } = require("uuid");

exports.createCity = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "City name is required" });
    }

    const city_id = uuidv4();

    const city = await City.create({
      name,
      city_id,
    });

    return res.status(201).json({
      message: "City created successfully",
      city,
    });
  } catch (error) {
    console.error("Error creating city:", error);
    return res.status(500).json({
      message: "Error creating city",
      error: error.message,
    });
  }
};

exports.getCities = async (req, res) => {
  try {
    const cities = await City.findAll({
      include: {
        model: Subcity, // Reference Subcity here
        as: "subcities", // Alias for the association
      },
    });

    return res.status(200).json({
      message: "Cities retrieved successfully",
      cities,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

exports.getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findOne({
      where: { city_id: id },
      include: {
        model: Subcity,
        as: "subcities",
      },
    });

    if (!city) {
      return res.status(404).json({
        message: "City not found",
      });
    }

    return res.status(200).json({
      message: "City retrieved successfully",
      city,
    });
  } catch (error) {
    console.error("Error fetching city:", error);
    return res.status(500).json({
      message: "Error fetching city",
      error: error.message,
    });
  }
};
(exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, updated_by } = req.body;

    const city = await City.findByPk(id);
    if (!city) {
      return res.status(404).json({
        message: "City not found",
      });
    }

    // Update the city
    city.name = name || city.name;
    city.updated_by = updated_by || city.updated_by;
    await city.save();

    return res.status(200).json({
      message: "City updated successfully",
      city,
    });
  } catch (error) {
    console.error("Error updating city:", error);
    return res.status(500).json({
      message: "Error updating city",
      error: error.message,
    });
  }
}),
  (exports.deleteCity = async (req, res) => {
    try {
      const { id } = req.params;

      const city = await City.findByPk(id);
      if (!city) {
        return res.status(404).json({
          message: "City not found",
        });
      }

      // Deleting the city
      await city.destroy();

      return res.status(200).json({
        message: "City deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting city:", error);
      return res.status(500).json({
        message: "Error deleting city",
        error: error.message,
      });
    }
  });
