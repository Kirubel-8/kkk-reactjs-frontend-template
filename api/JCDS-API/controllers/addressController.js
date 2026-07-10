const { Region, Zone, Woreda, City, Subcity } = require("../models");
exports.getLocations = async (req, res) => {
  try {

    const { id, subcity_id, zone_id } = req.query;

    if (!id && !subcity_id && !zone_id) {
      const cities = await City.findAll({ attributes: ["city_id", "name"] });
      const regions = await Region.findAll({
        attributes: ["region_id", "name"],
      });

      const locations = [
        ...cities.map((city) => ({
          type: "city",
          id: city.city_id,
          name: city.name,
        })),
        ...regions.map((region) => ({
          type: "region",
          id: region.region_id,
          name: region.name,
        })),
      ];

      return res.status(200).json({
        message: "Locations fetched successfully",
        locations,
      });
    }

    let data = {};

    if (subcity_id) {
      const subcity = await Subcity.findOne({
        where: { subcity_id },
        attributes: ["subcity_id", "name"],
      });

      if (subcity) {
        const woredas = await Woreda.findAll({
          where: { subcity_id },
          attributes: ["woreda_id", "name"],
        });

        data = {
          // subcity,
          woredas,
        };

        return res.status(200).json({
          message: "Subcity details fetched successfully",
          data,
        });
      }
      return res.status(404).json({ error: "Subcity not found." });
    }

    if (zone_id) {
      const zone = await Zone.findOne({
        where: { zone_id },
        attributes: ["zone_id", "name"],
      });

      if (zone) {
        const woredas = await Woreda.findAll({
          where: { zone_id },
          attributes: ["woreda_id", "name"],
        });

        data = {
          // zone,
          woredas,
        };

        return res.status(200).json({
          message: "Zone details fetched successfully",
          data,
        });
      }

      return res.status(404).json({ error: "Zone not found." });
    }

    // If a city_id is provided, fetch subcities
    if (id) {
      const city = await City.findOne({
        where: { city_id: id },
        attributes: ["city_id", "name"],
      });

      if (city) {
        const subcities = await Subcity.findAll({
          where: { city_id: id },
          attributes: ["subcity_id", "name"],
        });

        data = {
          subcities,
        };

        return res.status(200).json({
          message: "City details fetched successfully",
          data,
        });
      }

      const region = await Region.findOne({
        where: { region_id: id },
        attributes: ["region_id", "name"],
      });

      if (region) {
        const zones = await Zone.findAll({
          where: { region_id: id },
          attributes: ["zone_id", "name"],
        });

        data = {
          // region,
          zones,
        };

        return res.status(200).json({
          message: "Region details fetched successfully",
          data,
        });
      }

      const zone = await Zone.findOne({
        where: { zone_id: id },
        attributes: ["zone_id", "name"],
      });

      if (zone) {
        const woredas = await Woreda.findAll({
          where: { zone_id: id },
          attributes: ["woreda_id", "name"],
        });

        data = {
          // zone,
          woredas,
        };

        return res.status(200).json({
          message: "Zone details fetched successfully",
          data,
        });
      }

      return res.status(404).json({ error: "Location not found." });
    }
  } catch (error) {
    console.error("Error in getLocationsAndDetails:", error);
    res.status(500).json({ error: "Failed to fetch location details" });
  }
};
