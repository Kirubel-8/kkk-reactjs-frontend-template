"use strict";

const { Op } = require("sequelize");
const {
  Case,
  CaseDecision,
  CaseDecisionLetter,
  Complaint,
  DisciplinaryComplaint,
  CustomerAccount,
  StatusWithAgenda,
  User,
  Role,
  Permission,
} = require("../models");

const FEDERAL_LETTER_TYPES = ["federal_office_notice", "federal_office_forwarding"];

/**
 * Check if user has the specified permission.
 * @param {string} userId
 * @param {{ resource: string, action: string }} param1
 * @returns {Promise<boolean>}
 */
async function userHasPermission(userId, { resource, action }) {
  const user = await User.findOne({
    where: { user_id: userId },
    include: [
      {
        model: Role,
        as: "roles",
        include: [
          {
            model: Permission,
            as: "permissions",
            attributes: ["action", "resource"],
          },
        ],
      },
    ],
  });

  if (!user || !user.roles || user.roles.length === 0) return false;

  return user.roles.some((role) =>
    role.permissions?.some(
      (perm) => perm.resource === resource && perm.action === action
    )
  );
}

/**
 * List decided cases that have federal-office-targeted letters.
 * Accessible only to users with complaintFederalOffice read permission.
 */
exports.listCasesForFederalOffice = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const hasPermission = await userHasPermission(userId, {
      resource: "complaintFederalOffice",
      action: "read",
    });
    if (!hasPermission) return res.status(403).json({ error: "Forbidden" });

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Case.findAndCountAll({
      where: { status: "closed" },
      include: [
        {
          model: CaseDecision,
          as: "decision",
          required: true,
          include: [
            { model: StatusWithAgenda, as: "status" },
            {
              model: CaseDecisionLetter,
              as: "letters",
              required: true,
              where: {
                letter_type: { [Op.in]: FEDERAL_LETTER_TYPES },
                status: "draft",
              },
            },
          ],
        },
        {
          model: Complaint,
          as: "complaint",
          required: false,
          include: [{ model: CustomerAccount, as: "applicant" }],
        },
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          required: false,
          include: [{ model: CustomerAccount, as: "applicant" }],
        },
      ],
      distinct: true,
      limit,
      offset,
      order: [["updatedAt", "DESC"]],
    });

    return res.status(200).json({
      cases: rows,
      pagination: { totalCount: count, page, limit },
    });
  } catch (error) {
    console.error("listCasesForFederalOffice error:", error);
    return res.status(500).json({ error: error.message });
  }
};

