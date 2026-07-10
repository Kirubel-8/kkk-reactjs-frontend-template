const { sequelize, CaseType, CaseHasType, Case } = require("../models");
const { v4: uuidv4 } = require("uuid");

const CASE_STATUSES = {
  TYPE_ASSIGNED: "Case Type Assigned",
};

exports.createCaseType = async (req, res) => {
  try {
    const existingCaseType = await CaseType.findOne({
      where: { name: req.body.name },
    });
    if (existingCaseType) {
      return res
        .status(400)
        .json({ error: "Case type with this name already exists." });
    }

    const id = uuidv4();
    const case_type = await CaseType.create({
      case_type_id: id,
      ...req.body,
    });
    res
      .status(201)
      .json({ message: "Case type created successfully", case_type });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllCaseTypes = async (req, res) => {
  try {
    const case_types = await CaseType.findAll();
    res.status(200).json(case_types);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCaseTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const case_type = await CaseType.findByPk(id);

    if (!case_type) {
      return res.status(404).json({ error: "Case Type not found." });
    }

    res.status(200).json(case_type);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignCaseType = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { case_id } = req.params;
    const { case_type_id, notes } = req.body;

    if (!case_id || !case_type_id) {
      return res
        .status(400)
        .json({ error: "Case ID and Case Type ID are required." });
    }

    const caseInstance = await Case.findByPk(case_id, {
      include: [
        {
          model: CaseType,
          as: "caseTypes",
        },
      ],
      transaction: t,
    });
    if (!caseInstance) {
      return res.status(404).json({ error: "Case not found." });
    }

    const caseTypeInstance = await CaseType.findByPk(case_type_id, {
      transaction: t,
    });
    if (!caseTypeInstance) {
      return res.status(404).json({ error: "Case Type not found." });
    }

    const existingCaseType = await CaseHasType.findOne({
      where: { case_id, case_type_id },
      transaction: t,
    });
    if (existingCaseType) {
      return res
        .status(400)
        .json({ error: "Case Type is already assigned to this case." });
    }

    const caseHasType = await CaseHasType.create(
      {
        case_id,
        case_type_id,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { transaction: t }
    );

    await caseInstance.update(
      {
        case_status: CASE_STATUSES.TYPE_ASSIGNED,
        updatedAt: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res
      .status(201)
      .json({ message: "Case Type assigned successfully.", data: caseHasType });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};

exports.updateCaseType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const case_type = await CaseType.findByPk(id);
    if (!case_type) {
      return res.status(404).json({ error: "Case Type not found." });
    }

    if (name && name !== case_type.name) {
      const existingCaseType = await CaseType.findOne({ where: { name } });
      if (existingCaseType) {
        return res
          .status(400)
          .json({ error: "Another Case Type with this name already exists." });
      }
    }

    await case_type.update(req.body);
    res.status(200).json(case_type);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteCaseType = async (req, res) => {
  try {
    const { id } = req.params;
    const case_type = await CaseType.findByPk(id);

    if (!case_type) {
      return res.status(404).json({ error: "Case Type not found." });
    }

    await case_type.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
