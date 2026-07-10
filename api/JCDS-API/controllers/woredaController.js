const { Woreda } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

exports.createWoreda = async (req, res) => {
  try {
    const { name, zone_id, subcity_id } = req.body;


    if ((zone_id && subcity_id) || (!zone_id && !subcity_id)) {
      return res.status(400).json({
        error:
          "A woreda must be associated with either a zone_id or a subcity_id, but not both.",
      });
    }

    const id = uuidv4();

    const woreda = await Woreda.create({
      woreda_id: id,
      name,
      zone_id: zone_id || null,
      subcity_id: subcity_id || null,
    });

    res.status(201).json({
      message: "Woreda created successfully",
      woreda,
    });
  } catch (error) {
    console.error("Error in createWoreda:", error);
    res.status(500).json({
      error: "Failed to create woreda",
    });
  }
};

exports.getAllWoredas = async (req, res) => {
  try {
    const woredas = await Woreda.findAll();
    res.status(200).json(woredas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getWoredaById = async (req, res) => {
  try {
    const { id } = req.params;
    const woreda = await Woreda.findByPk(id);
    if (!woreda) return res.status(404).json({ error: "Woreda not found" });
    res.status(200).json(woreda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getWoredasByZoneId = async (req, res) => {
  try {
    const { value } = req.params;

    const woredas = await Woreda.findAll({
      where: {
        [Op.or]: [{ zone_id: value }, { subcity_id: value }],
      },
    });

    if (woredas.length === 0) {
      return res
        .status(400)
        .json({ error: "No woredas found for the given zone or subcity" });
    }

    res.status(200).json(woredas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWoreda = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, zone_id } = req.body;

    const woreda = await Woreda.findByPk(id);
    if (!woreda) return res.status(404).json({ error: "Woreda not found" });

    if (name) woreda.name = name;
    if (zone_id) woreda.zone_id = zone_id;

    await woreda.save();
    res.status(200).json(woreda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteWoreda = async (req, res) => {
  try {
    const { id } = req.params;
    const woreda = await Woreda.findByPk(id);
    if (!woreda) return res.status(404).json({ error: "Woreda not found" });

    await woreda.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
