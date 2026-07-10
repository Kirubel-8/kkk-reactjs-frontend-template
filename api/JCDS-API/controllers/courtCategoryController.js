const { CourtCategory, CourtOffice } = require("../models");

exports.createCourtCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Court category name required" });

    const category = await CourtCategory.create({ name });

    return res.status(201).json({
      message: "Court Category created successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

exports.getCourtCategories = async (req, res) => {
    try {
      const categories = await CourtCategory.findAll({
        // include: {
        //   model: CourtOffice,
        //   as: "offices",
        //   Required: false
        // },
      });

      console.log("ccccc", categories);
  
      return res.status(200).json({ categories });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };

  exports.getCourtCategoryById = async (req, res) => {
    try {
      const category = await CourtCategory.findOne({
        where: { court_category_id: req.params.id },
        include: { model: CourtOffice, as: "offices" },
      });
  
      if (!category)
        return res.status(404).json({ message: "Court category not found" });
  
      return res.status(200).json({ category });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };

  exports.updateCourtCategory = async (req, res) => {
    try {
      const { name } = req.body;
  
      const category = await CourtCategory.findByPk(req.params.id);
      if (!category)
        return res.status(404).json({ message: "Court category not found" });
  
      category.name = name || category.name;
      await category.save();
  
      return res.status(200).json({
        message: "Court category updated successfully",
        category,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };
  
  exports.deleteCourtCategory = async (req, res) => {
    try {
    const { id } = req.params;
    console.log("dcccc", id);

    const category = await CourtCategory.findByPk(id);
    if (!category)
    return res.status(404).json({ message: "Court category not found" });

    await category.destroy();
  
      return res.status(200).json({ message: "Court category deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };


  exports.createCourtOffice = async (req, res) => {
    try {
      const { name, court_category_id } = req.body;
  
      const category = await CourtCategory.findByPk(court_category_id);
      if (!category)
        return res.status(404).json({ message: "Category not found" });
  
      const office = await CourtOffice.create({ name, court_catagory_id: court_category_id });
  
      return res.status(201).json({ message: "Office created", office });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };

  exports.getCourtOffices = async (req, res) => {
    try {
      const offices = await CourtOffice.findAll({
        include: {
          model: CourtCategory,
          as: "category",
          attributes: ["court_category_id", "name"],
        },
      });
  
      return res.status(200).json({ offices });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };

  exports.getCourtOfficeById = async (req, res) => {
    try {
      const office = await CourtOffice.findOne({
        where: { court_office_id: req.params.id },
        include: {
          model: CourtCategory,
          as: "category",
          attributes: ["court_category_id", "name"],
        },
      });
  
      if (!office)
        return res.status(404).json({ message: "Court office not found" });
  
      return res.status(200).json({ office });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };

  exports.updateCourtOffice = async (req, res) => {
    try {
      const { name, court_category_id } = req.body;
  
      const office = await CourtOffice.findByPk(req.params.id);
      if (!office)
        return res.status(404).json({ message: "Court office not found" });
  
      office.name = name || office.name;
      office.court_category_id =
        court_category_id || office.court_category_id;
  
      await office.save();
  
      return res.status(200).json({
        message: "Court office updated successfully",
        office,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };

  exports.deleteCourtOffice = async (req, res) => {
    try {
      const office = await CourtOffice.findByPk(req.params.id);
      if (!office)
        return res.status(404).json({ message: "Court office not found" });
  
      await office.destroy();
  
      return res
        .status(200)
        .json({ message: "Court office deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };  

  exports.getOfficesByCategory = async (req, res) => {
    try {
      const category = await CourtCategory.findByPk(req.params.id, {
        include: {
          model: CourtOffice,
          as: "offices",
        },
      });
  
      if (!category)
        return res.status(404).json({ message: "Category not found" });
  
      return res.status(200).json({ offices: category.offices });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  };
  

