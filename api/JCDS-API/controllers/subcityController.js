const { Subcity, City } = require('../models');

exports.getSubcities = async (req, res) => {
  try {
    const subcities = await Subcity.findAll({
      include: {
        model: City,
        as: 'city',
        attributes: ['name', 'city_id'], 
      },
      attributes: ['subcity_id', 'name'], 
    });

    return res.status(200).json({
      message: 'All subcities retrieved successfully',
      subcities,
    });
  } catch (error) {
    console.error('Error fetching subcities:', error);
    return res.status(500).json({
      message: 'Error fetching subcities',
      error: error.message,
    });
  }
};

exports.getSubcityById = async (req, res) => {
    try {
      const { subcity_id } = req.params;
  
      const subcity = await Subcity.findByPk(subcity_id, {
        include: {
          model: City,
          as: 'city',
          attributes: ['name', 'city_id'], 
        },
        attributes: ['subcity_id', 'name'], 
      });
  
      if (!subcity) {
        return res.status(404).json({
          message: 'Subcity not found',
        });
      }
  
      return res.status(200).json({
        message: 'Subcity retrieved successfully',
        subcity,
      });
    } catch (error) {
      console.error('Error fetching subcity:', error);
      return res.status(500).json({
        message: 'Error fetching subcity',
        error: error.message,
      });
    }
  };

exports.createSubcity = async (req, res) => {
  try {
    const { name, city_id } = req.body;

    const city = await City.findByPk(city_id);
    if (!city) {
      return res.status(404).json({
        message: 'City not found',
      });
    }

    const subcity = await Subcity.create({
      name,
      city_id,
    });

    return res.status(201).json({
      message: 'Subcity created successfully',
      subcity,
    });
    
  } catch (error) {
    console.error('Error creating subcity:', error);
    return res.status(500).json({
      message: 'Error creating subcity',
      error: error.message,
    });
  }
};

exports.getSubcitiesByCity = async (req, res) => {
  try {
    const { city_id } = req.params;

    const city = await City.findByPk(city_id, {
      include: {
        model: Subcity,
        as: 'subcities',
      },
    });

    if (!city) {
      return res.status(404).json({
        message: 'City not found',
      });
    }

    return res.status(200).json({
      message: 'Subcities retrieved successfully',
      subcities: city.subcities,
    });
  } catch (error) {
    console.error('Error fetching subcities:', error);
    return res.status(500).json({
      message: 'Error fetching subcities',
      error: error.message,
    });
  }
};

exports.updateSubcity = async (req, res) => {
  try {
    const { subcity_id } = req.params;
    const { name, city_id } = req.body;

    const subcity = await Subcity.findByPk(subcity_id);
    if (!subcity) {
      return res.status(404).json({
        message: 'Subcity not found',
      });
    }

    const city = await City.findByPk(city_id);
    if (!city) {
      return res.status(404).json({
        message: 'City not found',
      });
    }

    subcity.name = name || subcity.name;
    subcity.city_id = city_id || subcity.city_id;
    await subcity.save();

    return res.status(200).json({
      message: 'Subcity updated successfully',
      subcity,
    });
  } catch (error) {
    console.error('Error updating subcity:', error);
    return res.status(500).json({
      message: 'Error updating subcity',
      error: error.message,
    });
  }
};

exports.deleteSubcity = async (req, res) => {
  try {
    const { subcity_id } = req.params;

    const subcity = await Subcity.findByPk(subcity_id);
    if (!subcity) {
      return res.status(404).json({
        message: 'Subcity not found',
      });
    }

    await subcity.destroy();

    return res.status(200).json({
      message: 'Subcity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subcity:', error);
    return res.status(500).json({
      message: 'Error deleting subcity',
      error: error.message,
    });
  }
};
