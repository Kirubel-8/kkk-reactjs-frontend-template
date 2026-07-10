const { StatusWithAgenda, Agendas, User, Permission, Role, CaseStatusWithAgenda } = require("../models");
const { v4: uuidv4 } = require("uuid");

exports.createStatusWithAgenda = async (req, res) => {
  try {
    const { agenda_id, name, description, created_by, type, decision_type } = req.body;

    const validTypes = ["committee", "council"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'committee' or 'council'." });
    }

    const validDecisionTypes = ["forward to judge", "forward to council office", "complaint closed", "back to committee", "back to council", "forward to committee", "forward to council"];
    if (!validDecisionTypes.includes(decision_type)) {
      return res.status(400).json({
        error:
          "Invalid decision_type. Must be 'forward to judge', 'forward to council office', 'complaint closed', 'back to committee', 'back to council', 'forward to committee', 'forward to council'.",
      });
    }

    const agenda = await Agendas.findByPk(agenda_id);
    if (!agenda) {
      return res.status(404).json({ error: "Agenda not found." });
    }
    

    const status = await StatusWithAgenda.create({
      status_id: uuidv4(),
      agenda_id,
      name,
      description,
      created_by,
      type,
      decision_type,
    });

    res.status(201).json({ message: "Status created successfully.", status });
  } catch (error) {
    console.error("Sequelize Error:", JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message, details: error.errors });
  }
};

exports.getAllStatusesWithAgendas = async (req, res) => {
  try {
    const statuses = await StatusWithAgenda.findAll({
      include: {
        model: Agendas,
        as: "agenda",
      },
    });

    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getStatusWithAgendaById = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await StatusWithAgenda.findByPk(id, {
      include: {
        model: Agendas,
        as: "agenda",
      },
    });

    if (!status) {
      return res.status(404).json({ error: "Status not found." });
    }

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatusWithAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenda_id, name, description, decision_type, type } = req.body;

    const validTypes = ["committee", "council"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'committee' or 'council'." });
    }

    const validDecisionTypes = ["forward to judge", "forward to council office", "complaint closed", "back to committee", "back to council", "forward to committee", "forward to council"];
    if (!validDecisionTypes.includes(decision_type)) {
      return res.status(400).json({ error: "Invalid decision type. Must be 'forward to judge', 'forward to council office', 'complaint closed', 'back to committee', 'back to council', 'forward to committee', 'forward to council'." });
    }

    const status = await StatusWithAgenda.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: "Status not found." });
    }

    if (agenda_id && agenda_id !== status.agenda_id) {
      const agenda = await Agendas.findByPk(agenda_id);
      if (!agenda) {
        return res.status(404).json({ error: "Agenda not found." });
      }
    }

    if (name && name !== status.name) {
      const existingStatus = await StatusWithAgenda.findOne({
        where: { name },
      });
      if (existingStatus) {
        return res
          .status(400)
          .json({ error: "Another status with this name already exists." });
      }
    }

    await status.update({
      agenda_id,
      name,
      description,
      type,
      decision_type
    });

    res.status(200).json({ message: "Status updated successfully.", status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStatusWithAgenda = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await StatusWithAgenda.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: "Status not found." });
    }

    await status.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
