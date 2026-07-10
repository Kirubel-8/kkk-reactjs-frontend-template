const { where } = require("sequelize");
const {
  sequelize,
  Case,
  Notification,
  Log,
  User,
  CaseHasType,
  CaseDecisionVotes,
  CaseType,
  Sequelize,
  sequelize,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
exports.assignCaseType = async (req, res) => {
  const userId = req.user?.id;
  const { case_id } = req.params;
  const { case_type_id } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!case_type_id) {
    return res.status(400).json({ error: "Case type ID is required" });
  }

  const t = await sequelize.transaction();

  try {
    // Verify case exists
    const foundCase = await Case.findOne({
      where: { case_id },
      transaction: t,
    });

    if (!foundCase) {
      await t.rollback();
      return res.status(404).json({ error: "Case not found" });
    }

    // Verify case type exists
    const caseType = await CaseType.findOne({
      where: { case_type_id },
      transaction: t,
    });

    if (!caseType) {
      await t.rollback();
      return res.status(404).json({ error: "Case type not found" });
    }

    // Update the case with case type
    await foundCase.update(
      {
        case_type: case_type_id,
        updated_by: userId,
      },
      { transaction: t }
    );

    // Optional: Also create entry in CaseHasType junction table if you need additional fields like notes
    await CaseHasType.create(
      {
        case_id,
        case_type_id,
        notes: `Case type assigned by user ${userId}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      message: "Case type assigned successfully",
      data: {
        case_id: foundCase.case_id,
        case_number: foundCase.case_number,
        case_type_id: case_type_id,
        case_type_name: caseType.name,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Assign Case Type Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
exports.assignMembersToMultipleCases = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { case_ids, member_ids } = req.body; // Arrays

    if (
      !Array.isArray(case_ids) ||
      case_ids.length === 0 ||
      !Array.isArray(member_ids) ||
      member_ids.length === 0
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "case_ids and member_ids arrays are required" });
    }

    const rows = [];

    // Loop through each case and assign each member
    for (const caseId of case_ids) {
      for (const memberId of member_ids) {
        rows.push({
          case_id: caseId,
          council_user_id: memberId,
          assigned_at: new Date(),
          is_voted: false,
        });
      }
    }

    // Bulk insert all assignments
    await CaseDecisionVotes.bulkCreate(rows, { transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Members assigned to selected cases successfully",
      assigned_count: rows.length,
    });
  } catch (error) {
    await t.rollback();
    console.error("Assign multiple members error:", error);
    return res.status(500).json({ error: error.message });
  }
};
