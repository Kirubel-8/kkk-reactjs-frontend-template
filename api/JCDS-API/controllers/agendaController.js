const { sequelize, Agendas } = require("../models");
const { v4: uuidv4 } = require("uuid");

exports.createAgenda = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existingAgenda = await Agendas.findOne({
      
      where: { name },
    });
    if (existingAgenda) {
      return res
        .status(400)
        .json({ error: "Agenda with this name already exists." });
    }

    const id = uuidv4();
    const agenda = await Agendas.create({
      agenda_id: id,
      name,
      description,
      ...req.body,
    });

    res.status(201).json({ message: "Agenda created successfully", agenda });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllAgendas = async (req, res) => {
  try {
    const agendas = await Agendas.findAll();
    res.status(200).json(agendas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAgendaById = async (req, res) => {
  try {
    const { id } = req.params;
    const agenda = await Agendas.findByPk(id);

    if (!agenda) {
      return res.status(404).json({ error: "Agenda not found." });
    }

    res.status(200).json(agenda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const agenda = await Agendas.findByPk(id);
    if (!agenda) {
      return res.status(404).json({ error: "Agenda not found." });
    }

    if (name && name !== agenda.name) {
      const existingAgenda = await Agendas.findOne({ where: { name } });
      if (existingAgenda) {
        return res
          .status(400)
          .json({ error: "Another Agenda with this name already exists." });
      }
    }

    await agenda.update({
      name,
      description,
      ...req.body,
    });

    res.status(200).json(agenda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const agenda = await Agendas.findByPk(id);

    if (!agenda) {
      return res.status(404).json({ error: "Agenda not found." });
    }

    await agenda.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
