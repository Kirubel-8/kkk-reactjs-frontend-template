const { sequelize } = require("../models");
const {
  CouncilMembersReview,
  Case,
  StatusWithAgenda,
  User,
  DisciplinaryComplaint,
  Department,
  CaseAttachment,
  CustomerAccount,
  ExpertAttachment,
  CommitteeMembersReview,
  CaseDecisionVotes,
  CaseDecision,
  CaseType,
  Notification,
  DisciplinaryComplaintEvidence,
  DisciplinaryComplaintIssue,
  Role,
  Log,
  Permission,
} = require("../models");
const { Op } = require("sequelize");
exports.getCasesUnderCouncilReview = async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        status: ["committe decided", "council_review_completed"],
      },
      include: [
        { model: DisciplinaryComplaint, as: "disciplinary_complaint" },
        { model: CaseType, as: "caseType" },
        { model: Department, as: "assigned_committee_ref" },
        { model: CaseAttachment, as: "attachments" },
        { model: ExpertAttachment, as: "expert_attachments" },
        {
          model: CommitteeMembersReview,
          as: "committeeReviews",
        },

        {
          model: CaseDecisionVotes,
          as: "case_decision_votes",
          include: [
            {
              model: User,
              as: "councilMember",
              attributes: ["user_id", "full_name"],
            },
            {
              model: StatusWithAgenda,
              as: "decisionStatus",
              attributes: ["status_id", "name"],
            },
          ],
        },
        // Add final decision
        {
          model: CaseDecision,
          as: "decision",
          include: [
            {
              model: StatusWithAgenda,
              as: "status",
              attributes: ["status_id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (err) {
    console.error("Error fetching council review cases:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Submit council member decision
exports.submitCouncilDecision = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const user_id = req.user?.id;
    if (!user_id) {
      await t.rollback();
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { case_id, status_id, description } = req.body;

    // Validate required fields
    if (!case_id || !status_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "case_id and status_id are required",
      });
    }

    // Check if user is assigned to this case
    const assignment = await CaseDecisionVotes.findOne({
      where: {
        case_id,
        council_user_id: user_id,
      },
      transaction: t,
    });

    if (!assignment) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: "You are not assigned to this case",
      });
    }

    if (assignment.is_voted) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "You have already submitted your decision for this case",
      });
    }

    // Validate decision status
    const decisionStatus = await StatusWithAgenda.findByPk(status_id, {
      transaction: t,
    });

    // Update assignment with decision
    await assignment.update(
      {
        status_id,
        description,
        is_voted: true,
        vote_at: new Date(),

        updated_at: new Date(),
      },
      { transaction: t }
    );

    // Check if all members have voted and calculate final decision
    const finalResult = await calculateAndStoreFinalDecision(case_id, t);

    // Log the decision
    // await Log.create(
    //   {
    //     case_id,
    //     reference_id: assignment.case?.disciplinary_complaint_id,
    //     user_log_id: user_id,
    //     action: "COUNCIL_DECISION_SUBMITTED",
    //     description: `Submitted decision: ${decisionStatus.name}`,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   },
    //   { transaction: t }
    // );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Decision submitted successfully",
      data: {
        vote: assignment,
        finalDecision: finalResult
          ? {
              message: "Final decision has been calculated",
              decision: finalResult.finalDecision,
              summary: finalResult.decisionSummary,
            }
          : {
              message: "Waiting for other council members to vote",
            },
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error submitting council decision:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const calculateAndStoreFinalDecision = async (case_id, transaction) => {
  try {
    console.log("=== CALCULATE FINAL DECISION STARTED ===");
    console.log("Case ID:", case_id);

    // Get all votes for this case
    const votes = await CaseDecisionVotes.findAll({
      where: {
        case_id,
        is_voted: true,
      },
      include: [
        {
          model: StatusWithAgenda,
          as: "decisionStatus",
          attributes: ["status_id", "name"],
        },
        {
          model: User,
          as: "councilMember",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
      transaction,
    });

    console.log("Votes found:", votes.length);
    console.log(
      "Votes data:",
      votes.map((v) => ({
        id: v.id,
        council_user_id: v.council_user_id,
        status_id: v.status_id,
        assigned_by: v.assigned_by,
        StatusWithAgendum: v.StatusWithAgendum?.name,
      }))
    );

    if (votes.length === 0) {
      console.log("No votes found, returning null");
      return null;
    }

    // Get total assigned members count
    const totalAssigned = await CaseDecisionVotes.count({
      where: { case_id },
      transaction,
    });

    console.log("Total assigned members:", totalAssigned);
    console.log("Total votes:", votes.length);

    // Check if all assigned members have voted
    const allVoted = votes.length >= totalAssigned;

    if (!allVoted) {
      console.log("Not all members have voted yet, returning null");
      return null; // Wait for all votes
    }

    console.log("All members have voted, calculating final decision...");

    // Count votes by status
    const voteCounts = {};
    const voteDetails = [];

    votes.forEach((vote) => {
      console.log("Processing vote:", {
        vote_id: vote.id,
        status_id: vote.status_id,
        status_name: vote.StatusWithAgendum?.name,
      });

      // IMPORTANT: Check the actual property name from your model
      const statusName =
        vote.StatusWithAgendum?.name ||
        (vote.decisionStatus ? vote.decisionStatus.name : "Unknown");

      console.log("Status name determined:", statusName);

      if (!voteCounts[statusName]) {
        voteCounts[statusName] = {
          count: 0,
          votes: [],
          hasCouncilHead: false,
        };
      }

      voteCounts[statusName].count++;
      voteCounts[statusName].votes.push({
        council_user_id: vote.council_user_id,
        council_name: vote.User?.full_name || "Unknown",
        description: vote.description,
        vote_at: vote.vote_at,
      });

      // Check if this vote is from the Council Head
      const isCouncilHead = vote.council_user_id === vote.assigned_by;
      console.log(
        `Is Council Head? ${vote.council_user_id} === ${vote.assigned_by} = ${isCouncilHead}`
      );

      if (isCouncilHead) {
        voteCounts[statusName].hasCouncilHead = true;
        voteCounts[statusName].councilHeadVote = {
          council_user_id: vote.council_user_id,
          council_name: vote.User?.full_name || "Council Head",
          description: vote.description,
          vote_at: vote.vote_at,
        };
      }
    });

    console.log("Vote counts:", JSON.stringify(voteCounts, null, 2));

    // Find the Council Head from assigned_by
    const councilHeadId = votes[0]?.assigned_by;
    console.log("Council Head ID:", councilHeadId);

    let councilHead = null;
    if (councilHeadId) {
      councilHead = await User.findByPk(councilHeadId, {
        attributes: ["user_id", "full_name", "email"],
        transaction,
      });
      console.log("Council Head found:", councilHead?.full_name);
    }

    // Determine final decision
    const statusNames = Object.keys(voteCounts);
    console.log("Status names in votes:", statusNames);

    let finalDecision = null;
    let tieBreakUsed = false;
    let tieBreakReason = "";
    let winningStatusId = null;

    if (statusNames.length === 1) {
      // All votes are the same
      finalDecision = statusNames[0];
      console.log("All votes are for same status:", finalDecision);
    } else {
      // Find the status with maximum votes
      const maxVotes = Math.max(
        ...Object.values(voteCounts).map((v) => v.count)
      );

      // Check which statuses have the maximum votes
      const topStatuses = statusNames.filter(
        (status) => voteCounts[status].count === maxVotes
      );

      console.log("Max votes:", maxVotes);
      console.log("Top statuses:", topStatuses);

      if (topStatuses.length === 1) {
        // Clear winner
        finalDecision = topStatuses[0];
        console.log("Clear winner:", finalDecision);
      } else {
        // Tie - use Council Head's vote to break tie
        tieBreakUsed = true;
        console.log("Tie detected between:", topStatuses);

        // Find which tied status has the Council Head's vote
        const tiedStatusWithCouncilHead = topStatuses.find(
          (status) => voteCounts[status].hasCouncilHead
        );

        console.log(
          "Status with Council Head vote:",
          tiedStatusWithCouncilHead
        );

        if (tiedStatusWithCouncilHead) {
          finalDecision = tiedStatusWithCouncilHead;
          tieBreakReason = `Tie broken using Council Head's vote (${
            councilHead?.full_name || "Council Head"
          })`;
          console.log("Tie broken with Council Head vote:", finalDecision);
        } else {
          // Council Head didn't vote for any tied option - use alphabetical or other tie-breaker
          finalDecision = topStatuses.sort()[0]; // Default to alphabetical
          tieBreakReason = `Tie broken alphabetically (Council Head not in tied options)`;
          console.log("Tie broken alphabetically:", finalDecision);
        }
      }
    }

    console.log("Final decision:", finalDecision);
    console.log("Tie break used:", tieBreakUsed);
    console.log("Tie break reason:", tieBreakReason);

    // Get the winning status from the votes
    const winningVote = votes.find(
      (v) =>
        v.StatusWithAgendum?.name === finalDecision ||
        (v.decisionStatus && v.decisionStatus.name === finalDecision)
    );

    if (winningVote) {
      winningStatusId = winningVote.status_id;
      console.log("Winning status ID from vote:", winningStatusId);
    } else {
      // Try to find status by name
      const winningStatus = await StatusWithAgenda.findOne({
        where: { name: finalDecision },
        transaction,
      });

      if (winningStatus) {
        winningStatusId = winningStatus.status_id;
        console.log("Winning status ID from lookup:", winningStatusId);
      } else {
        console.error(
          "ERROR: Could not find winning status. Final decision:",
          finalDecision
        );
        console.error("Available status names:", statusNames);

        // Try to get status ID from first vote with this status name
        const statusVotes = votes.filter(
          (v) => v.StatusWithAgendum?.name === finalDecision
        );
        if (statusVotes.length > 0) {
          winningStatusId = statusVotes[0].status_id;
          console.log(
            "Using status ID from first matching vote:",
            winningStatusId
          );
        } else {
          throw new Error(
            `Status "${finalDecision}" not found in StatusWithAgenda table`
          );
        }
      }
    }

    // Prepare decision summary
    const decisionSummary = {
      total_votes: votes.length,
      total_assigned: totalAssigned,
      vote_distribution: voteCounts,
      tie_break_used: tieBreakUsed,
      tie_break_reason: tieBreakReason,
      council_head: councilHead
        ? {
            user_id: councilHead.user_id,
            name: councilHead.full_name,
            email: councilHead.email,
            voted_for:
              Object.keys(voteCounts).find(
                (status) => voteCounts[status].hasCouncilHead
              ) || "Did not vote for any tied option",
          }
        : null,
    };

    console.log("Decision summary prepared");

    // Update case with final decision
    const caseRecord = await Case.findByPk(case_id, { transaction });
    let createdCaseDecision = null;
    if (caseRecord) {
      console.log("Updating case record...");

      await caseRecord.update(
        {
          status: "council_review_completed", // Changed from council_review_completed to closed for letter generation
          final_decision: finalDecision,
          final_decision_status_id: winningStatusId,
          final_decision_reason: tieBreakUsed
            ? tieBreakReason
            : `Majority decision (${voteCounts[finalDecision]?.count || 0}/${
                votes.length
              })`,
          decision_calculated_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );

      // Update DisciplinaryComplaint status to 'decided' for letter generation
      // if (caseRecord.disciplinary_complaint_id) {
      //   await DisciplinaryComplaint.update(
      //     { status: "decided" },
      //     {
      //       where: {
      //         disciplinary_complaint_id: caseRecord.disciplinary_complaint_id,
      //       },
      //       transaction,
      //     }
      //   );
      //   console.log("DisciplinaryComplaint status updated to 'decided'");
      // }

      // Create CaseDecision record
      createdCaseDecision = await CaseDecision.create(
        {
          case_id,
          decision_status: winningStatusId,
          updated_by: councilHeadId || "05e9e4e5-47f9-4aaf-bed3-63216df6bd74",
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );
      console.log("CaseDecision created:", createdCaseDecision.decision_id);
      // caseDecision = caseDecision.decision_id;
      // Send notifications about final decision
      const notificationPromises = votes.map((vote) => {
        console.log("Notification create params", {
          case_id,
          complaint_id: caseRecord.disciplinary_complaint_id,
          recipient_user_id: vote.council_user_id,
          sender_id: councilHeadId || "05e9e4e5-47f9-4aaf-bed3-63216df6bd74",
          type: "in_app",
          title: "Final Decision Reached",
          message: `Final decision for case ${
            caseRecord.case_number
          }: ${finalDecision}. ${tieBreakUsed ? tieBreakReason : ""}`,
          is_read: false,
        });
        return Notification.create(
          {
            case_id,
            complaint_id: caseRecord.disciplinary_complaint_id,
            recipient_user_id: vote.council_user_id,
            sender_id: councilHeadId || "05e9e4e5-47f9-4aaf-bed3-63216df6bd74",
            type: "in_app",
            title: "Final Decision Reached",
            message: `Final decision for case ${
              caseRecord.case_number
            }: ${finalDecision}. ${tieBreakUsed ? tieBreakReason : ""}`,
            is_read: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction }
        );
      });

      // Also notify Council Head if they didn't vote
      if (
        councilHeadId &&
        !votes.find((v) => v.council_user_id === councilHeadId)
      ) {
        notificationPromises.push(
          Notification.create(
            {
              case_id,
              complaint_id: caseRecord.disciplinary_complaint_id,
              recipient_user_id: councilHeadId,
              sender_id: null, // System notification
              type: "in_app",
              title: "Final Decision Reached",
              message: `Final decision for case ${
                caseRecord.case_number
              } that you assigned: ${finalDecision}. ${
                tieBreakUsed ? tieBreakReason : ""
              }`,
              is_read: false,
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction }
          )
        );
      }

      await Promise.all(notificationPromises);
      console.log("Notifications sent");

      // Log the final decision
      // await Log.create(
      //   {
      //     case_id,
      //     reference_id: caseRecord.disciplinary_complaint_id,
      //     user_log_id: councilHeadId || 1, // Council Head or system
      //     action: "FINAL_DECISION_CALCULATED",
      //     description: `Final decision: ${finalDecision}. ${
      //       tieBreakUsed ? `Tie broken: ${tieBreakReason}` : `Majority vote`
      //     }`,
      //     metadata: JSON.stringify(decisionSummary),
      //     created_at: new Date(),
      //     updated_at: new Date(),
      //   },
      //   { transaction }
      // );

      console.log("Log entry created");
    }

    console.log("=== CALCULATION COMPLETE ===");

    return {
      finalDecision,
      decisionSummary,
      tieBreakUsed,
      tieBreakReason,
      caseDecisionId: createdCaseDecision?.decision_id,
    };
  } catch (error) {
    console.error("Error calculating final decision:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
};
// Get case decision votes
exports.getCaseDecisionVotes = async (req, res) => {
  try {
    const { case_id } = req.params;

    if (!case_id) {
      return res.status(400).json({ error: "case_id is required" });
    }

    const decisionVotes = await CaseDecisionVotes.findAll({
      where: { case_id },
      include: [
        {
          model: User,
          as: "councilMember",
          attributes: ["user_id", "full_name", "email", "department_id"],
        },
        {
          model: StatusWithAgenda,
          as: "decisionStatus",
          attributes: ["status_id", "name", "description"],
        },
      ],
      order: [
        ["is_voted", "DESC"],
        ["vote_at", "DESC"],
        ["assigned_at", "ASC"],
      ],
    });

    const totalAssigned = decisionVotes.length;
    const votedCount = decisionVotes.filter((vote) => vote.is_voted).length;
    const pendingCount = totalAssigned - votedCount;

    return res.status(200).json({
      decisionVotes,
      summary: {
        total_assigned: totalAssigned,
        voted: votedCount,
        pending: pendingCount,
        completion_percentage:
          totalAssigned > 0 ? (votedCount / totalAssigned) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Get case decision votes error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getDecisionStatistics = async (req, res) => {
  try {
    const { case_id } = req.params;

    console.log("=== GET DECISION STATISTICS DEBUG ===");
    console.log("Case ID:", case_id);

    if (!case_id) {
      return res.status(400).json({ error: "case_id is required" });
    }

    // First, check if case exists
    const caseRecord = await Case.findByPk(case_id);
    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Get all assigned members for this case (both voted and pending)
    const allAssignments = await CaseDecisionVotes.findAll({
      where: {
        case_id,
      },
      include: [
        {
          model: User,
          as: "councilMember",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
      raw: false,
    });

    console.log("Total assigned members for case:", allAssignments.length);

    // Get submitted decisions
    const submittedDecisions = allAssignments.filter(
      (assignment) => assignment.is_voted
    );
    const pendingAssignments = allAssignments.filter(
      (assignment) => !assignment.is_voted
    );

    console.log("Submitted decisions:", submittedDecisions.length);
    console.log("Pending decisions:", pendingAssignments.length);

    const totalAssignedMembers = allAssignments.length;
    const submittedCount = submittedDecisions.length;
    const pendingCount = pendingAssignments.length;

    // Calculate completion percentage based on assigned members only
    const completionPercentage =
      totalAssignedMembers > 0
        ? (submittedCount / totalAssignedMembers) * 100
        : 0;

    // Calculate decision breakdown (group by status name)
    const decisionBreakdown = {};
    const decisionDetails = [];

    for (const decision of submittedDecisions) {
      let statusName = "Unknown";
      let statusCode = "unknown";

      if (decision.status_id) {
        const decisionStatus = await StatusWithAgenda.findByPk(
          decision.status_id
        );
        if (decisionStatus) {
          statusName = decisionStatus.name;
          statusCode =
            decisionStatus.code ||
            statusName.toLowerCase().replace(/\s+/g, "_");
        }
      }

      decisionBreakdown[statusName] = (decisionBreakdown[statusName] || 0) + 1;

      // Add detailed information for each vote
      decisionDetails.push({
        council_member: {
          user_id: decision.council_user_id,
          name: decision.CouncilMember?.full_name || "Unknown",
          email: decision.CouncilMember?.email,
        },
        status: statusName,
        description: decision.description,
        vote_at: decision.vote_at,
        is_council_head: decision.assigned_by === decision.council_user_id, // Check if this member is the Council Head
      });
    }

    // Find the Council Head who assigned members
    let councilHead = null;
    let councilHeadVote = null;

    if (allAssignments.length > 0 && allAssignments[0].assigned_by) {
      const councilHeadUser = await User.findByPk(
        allAssignments[0].assigned_by,
        {
          attributes: ["user_id", "full_name", "email"],
        }
      );

      if (councilHeadUser) {
        councilHead = {
          user_id: councilHeadUser.user_id,
          name: councilHeadUser.full_name,
          email: councilHeadUser.email,
        };

        // Check if Council Head has voted
        councilHeadVote = submittedDecisions.find(
          (d) => d.council_user_id === councilHeadUser.user_id
        );
      }
    }

    // Check for potential tie situation
    const maxVotes = Math.max(...Object.values(decisionBreakdown));
    const isTie =
      Object.values(decisionBreakdown).filter((v) => v === maxVotes).length > 1;

    let tieBreakInfo = null;
    if (isTie && councilHead) {
      tieBreakInfo = {
        council_head_voted: !!councilHeadVote,
        council_head_vote: councilHeadVote?.status_id
          ? await StatusWithAgenda.findByPk(councilHeadVote.status_id)
          : null,
        would_break_tie: councilHeadVote ? true : false,
      };
    }

    // Get voting timeline
    const votingTimeline = submittedDecisions
      .filter((d) => d.vote_at)
      .map(async (d) => ({
        council_member: d.CouncilMember?.full_name || "Unknown",
        status: d.status_id
          ? (await StatusWithAgenda.findByPk(d.status_id))?.name
          : "",
        voted_at: d.vote_at,
        time_to_vote:
          d.vote_at && d.assigned_at
            ? Math.round(
                (new Date(d.vote_at) - new Date(d.assigned_at)) /
                  (1000 * 60 * 60 * 24)
              ) // Days to vote
            : null,
      }))
      .sort((a, b) => new Date(a.voted_at) - new Date(b.voted_at));

    const statistics = {
      case_info: {
        case_id: caseRecord.case_id,
        case_number: caseRecord.case_number,
        status: caseRecord.status,
        total_assigned_members: totalAssignedMembers,
      },
      voting_summary: {
        submitted_decisions: submittedCount,
        pending_decisions: pendingCount,
        completion_percentage: Math.round(completionPercentage * 100) / 100, // Keep 2 decimal places
        voting_status:
          submittedCount === totalAssignedMembers ? "completed" : "in_progress",
      },
      decision_distribution: {
        breakdown: decisionBreakdown,
        details: decisionDetails,
        is_tie: isTie,
        tie_break_info: tieBreakInfo,
      },
      council_head: councilHead,
      pending_members: pendingAssignments.map((member) => ({
        user_id: member.council_user_id,
        name: member.CouncilMember?.full_name || "Unknown",
        email: member.CouncilMember?.email,
        assigned_at: member.assigned_at,
      })),
      voting_timeline: votingTimeline,
      voting_system: "case_assignment_based", // Changed from permission_based
      metadata: {
        calculation_timestamp: new Date(),
        calculation_method: "assigned_members_count",
      },
    };

    console.log("Final assignment-based statistics:", {
      total_assigned: totalAssignedMembers,
      submitted: submittedCount,
      pending: pendingCount,
      completion: statistics.voting_summary.completion_percentage + "%",
      breakdown: decisionBreakdown,
    });

    return res.status(200).json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error("Get decision statistics error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get final decision for a case
exports.getFinalDecision = async (req, res) => {
  try {
    const { case_id } = req.params;

    if (!case_id) {
      return res.status(400).json({ error: "case_id is required" });
    }

    const finalDecision = await CaseDecision.findOne({
      where: { case_id },
      include: [
        {
          model: StatusWithAgenda,
          as: "status",
          attributes: ["status_id", "name", "description"],
        },
        {
          model: Case,
          as: "case",
          attributes: ["case_id", "case_number"],
        },
      ],
    });

    if (!finalDecision) {
      return res
        .status(404)
        .json({ error: "Final decision not found for this case" });
    }

    return res.status(200).json({ finalDecision });
  } catch (error) {
    console.error("Get final decision error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get all council decisions for a case
exports.getCouncilDecisions = async (req, res) => {
  try {
    const { case_id } = req.params;

    if (!case_id) {
      return res.status(400).json({ error: "case_id is required" });
    }

    const councilDecisions = await CouncilMembersReview.findAll({
      where: { case_id },
      include: [
        {
          model: User,
          as: "councilMember",
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
        {
          model: StatusWithAgenda,
          as: "decisionStatus",
          attributes: ["status_id", "status_name", "status_code"],
        },
        {
          model: User,
          as: "councilHead",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
      order: [["reviewed_at", "DESC"]],
    });

    return res.status(200).json({
      councilDecisions,
      total: councilDecisions.length,
    });
  } catch (error) {
    console.error("Get council decisions error:", error);
    return res.status(500).json({ error: error.message });
  }
};
// Get case details for council review
// Get detailed case information
exports.getCaseDetails = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseDetails = await Case.findByPk(caseId, {
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["customer_id", "full_name", "email"],
            },
          ],
        },
        {
          model: CaseType,
          as: "caseType",
          attributes: ["case_type_id", "name"],
          required: false, // Use false if case_type might be null
        },
        { model: Department, as: "assigned_committee_ref" },
        {
          model: CaseAttachment,
          as: "attachments",
          attributes: [
            "case_attachment_id",
            "file_name",
            "file_path",
            "file_status",
          ],
        },
        {
          model: ExpertAttachment,
          as: "expert_attachments",
          attributes: [
            "expert_attachment_id",
            "document_name",
            "document_path",
            "document_status",
          ],
        },
        {
          model: CaseDecisionVotes,
          as: "case_decision_votes",
          include: [
            {
              model: User,
              as: "councilMember",
              attributes: ["user_id", "full_name", "email"],
            },
            {
              model: StatusWithAgenda,
              as: "decisionStatus",
              attributes: ["status_id", "name"],
            },
          ],
        },
        {
          model: CaseDecision,
          as: "decision",
          include: [
            {
              model: StatusWithAgenda,
              as: "status",
              attributes: ["status_id", "name"],
            },
          ],
        },
      ],
    });

    if (!caseDetails) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }
    console.log(
      "📌 Case Decision:",
      JSON.stringify(caseDetails?.decision, null, 2)
    );

    return res.status(200).json({
      success: true,
      data: caseDetails,
    });
  } catch (error) {
    console.error("Error fetching case details:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.getCaseVoteDetails = async (req, res) => {
  try {
    const { case_id } = req.params;

    // Get all votes for this case
    const votes = await CaseDecisionVotes.findAll({
      where: { case_id },
      include: [
        {
          model: StatusWithAgenda,
          attributes: ["id", "name", "code"],
        },
        {
          model: User,
          as: "CouncilMember",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
      order: [["vote_at", "ASC"]],
    });

    if (votes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No votes found for this case",
      });
    }

    // Get Council Head info from assigned_by
    const councilHeadId = votes[0]?.assigned_by;
    let councilHead = null;
    if (councilHeadId) {
      councilHead = await User.findByPk(councilHeadId, {
        attributes: ["user_id", "full_name", "email"],
      });
    }

    // Count votes
    const voteCounts = {};
    const voteDetails = votes.map((vote) => {
      const statusName = vote.StatusWithAgenda?.name || "Unknown";
      if (!voteCounts[statusName]) {
        voteCounts[statusName] = 0;
      }
      voteCounts[statusName]++;

      const isCouncilHead = vote.council_user_id === councilHeadId;

      return {
        council_member: vote.CouncilMember,
        status: vote.StatusWithAgendum,
        description: vote.description,
        vote_at: vote.vote_at,
        is_voted: vote.is_voted,
        is_council_head: isCouncilHead,
        assigned_by: vote.assigned_by,
      };
    });

    // Check if there's a tie
    const voteValues = Object.values(voteCounts);
    const maxVotes = Math.max(...voteValues);
    const isTie = voteValues.filter((v) => v === maxVotes).length > 1;

    // Determine if Council Head's vote would break tie
    let tieBreakInfo = null;
    if (isTie && councilHeadId) {
      const councilHeadVote = votes.find(
        (v) => v.council_user_id === councilHeadId
      );
      if (councilHeadVote && councilHeadVote.is_voted) {
        const councilHeadStatus = councilHeadVote.StatusWithAgenda?.name;
        tieBreakInfo = {
          has_council_head_vote: true,
          council_head_vote_for: councilHeadStatus,
          would_break_tie_for: councilHeadStatus,
        };
      } else {
        tieBreakInfo = {
          has_council_head_vote: false,
          council_head_vote_for: null,
          would_break_tie_for: "N/A (Council Head has not voted)",
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        total_votes: votes.filter((v) => v.is_voted).length,
        total_assigned: votes.length,
        council_head: councilHead,
        vote_distribution: voteCounts,
        is_tie: isTie,
        tie_break_info: tieBreakInfo,
        votes: voteDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching vote details:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get available council members
exports.getAvailableCouncilMembers = async (req, res) => {
  try {
    const members = await User.findAll({
      where: {
        account_status: true, // must be active users only
      },
      attributes: ["user_id", "full_name", "email", "department_id"],

      include: [
        {
          model: Role,
          as: "roles",
          required: true,
          through: { attributes: [] },

          include: [
            {
              model: Permission,
              as: "permissions",
              required: true,
              where: {
                resource: "CommitteeDecided",
                action: "submit_decision",
              },
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    return res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("Get available members error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get decision options
exports.getDecisionOptions = async (req, res) => {
  try {
    const options = await StatusWithAgenda.findAll({
      attributes: ["status_id", "name", "description"],
      raw: true, // <-- this is important
    });
    console.log("opppppppppppppppppp", options);
    return res.status(200).json({ options });
  } catch (error) {
    console.error("Get decision options error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getUserVoteStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { case_id } = req.params;

    console.log("=== GET USER VOTE STATUS DEBUG ===");
    console.log("User ID:", userId);
    console.log("Case ID:", case_id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!case_id) {
      return res.status(400).json({ error: "Case ID is required" });
    }

    // Check if case exists
    const caseRecord = await Case.findByPk(case_id);
    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Find user's vote for this case
    const userVote = await CaseDecisionVotes.findOne({
      where: {
        case_id: case_id,
        council_user_id: userId,
      },
      include: [
        {
          model: StatusWithAgenda,
          as: "decisionStatus",
          attributes: ["status_id", "name", "description"],
        },
      ],
      attributes: [
        "status_id",
        "description",
        "is_voted",
        "vote_at",
        "assigned_at",
      ],
    });

    console.log("User vote query result:", userVote);

    return res.status(200).json({
      success: true,
      hasVoted: userVote ? userVote.is_voted : false,
      vote: userVote,
      message: userVote
        ? userVote.is_voted
          ? "Vote already submitted"
          : "Vote assigned but not submitted"
        : "No vote found for this case",
    });
  } catch (error) {
    console.error("Get user vote status error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getTotalVotingMembers = async (req, res) => {
  try {
    // Get total users with can_vote permission
    const totalVotingMembers = await User.count({
      include: [
        {
          model: Role,
          as: "roles",
          include: [
            {
              model: Permission,
              as: "permissions",
              where: {
                resource: "CommitteeDecided",
                action: "submit_decision",
              },
              required: true,
              through: { attributes: [] },
            },
          ],
          through: { attributes: [] },
        },
      ],
    });

    console.log("Total voting members count:", totalVotingMembers);

    return res.status(200).json({
      success: true,
      total_voting_members: totalVotingMembers,
    });
  } catch (error) {
    console.error("Get total voting members error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.assignMembersToMultipleCases = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { case_ids, member_ids } = req.body; // Arrays
    const assigned_by = req.user?.id; // Council Head ID

    console.log("=== ASSIGN MEMBERS TO MULTIPLE CASES DEBUG ===");
    console.log("Case IDs:", case_ids);
    console.log("Member IDs:", member_ids);
    console.log("Assigned by (Council Head):", assigned_by);

    if (!assigned_by) {
      await t.rollback();
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Council Head ID not found",
      });
    }

    if (!Array.isArray(case_ids) || case_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "case_ids array is required and must not be empty",
      });
    }

    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "member_ids array is required and must not be empty",
      });
    }

    // Validate cases exist and are in correct status
    const cases = await Case.findAll({
      where: {
        case_id: case_ids,
        status: "committe decided",
      },
      transaction: t,
    });

    if (cases.length !== case_ids.length) {
      const foundCaseIds = cases.map((c) => c.case_id);
      const invalidCaseIds = case_ids.filter(
        (id) => !foundCaseIds.includes(id)
      );

      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "One or more cases not found or not in council review stage",
        invalid_cases: invalidCaseIds,
        required_status: "committe decided",
      });
    }

    // Validate council members exist and are active
    const councilMembers = await User.findAll({
      where: {
        user_id: member_ids,
        account_status: true,
      },
      transaction: t,
    });

    if (councilMembers.length !== member_ids.length) {
      const foundMemberIds = councilMembers.map((m) => m.user_id);
      const invalidMemberIds = member_ids.filter(
        (id) => !foundMemberIds.includes(id)
      );

      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "One or more council members not found or inactive",
        invalid_members: invalidMemberIds,
      });
    }

    // Get already assigned members for these cases
    const existingCountByCase = await CaseDecisionVotes.findAll({
      attributes: [
        "case_id",
        [sequelize.fn("COUNT", sequelize.col("council_user_id")), "count"],
      ],
      where: { case_id: case_ids },
      group: ["case_id"],
      transaction: t,
    });

    const assignedMap = {};
    existingCountByCase.forEach((row) => {
      assignedMap[row.case_id] = parseInt(row.dataValues.count);
    });

    // Check minimum assignment per case
    for (const caseId of case_ids) {
      const alreadyAssigned = assignedMap[caseId] || 0;

      // If no assignments exist yet → require at least 3
      if (alreadyAssigned === 0 && member_ids.length < 3) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Case ${caseId} requires at least 3 council members for initial assignment.`,
        });
      }

      // If partially assigned (1 or 2) → ensure total >= 3
      if (
        alreadyAssigned > 0 &&
        alreadyAssigned < 3 &&
        alreadyAssigned + member_ids.length < 3
      ) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Case ${caseId} already has ${alreadyAssigned} members. You must assign at least ${
            3 - alreadyAssigned
          } more to reach minimum 3.`,
        });
      }
    }

    // Check for existing assignments across all cases
    const existingAssignments = await CaseDecisionVotes.findAll({
      where: {
        case_id: case_ids,
        council_user_id: member_ids,
      },
      transaction: t,
    });

    const existingAssignmentMap = new Map();
    existingAssignments.forEach((assignment) => {
      const key = `${assignment.case_id}-${assignment.council_user_id}`;
      existingAssignmentMap.set(key, assignment);
    });

    const newAssignments = [];
    const duplicateAssignments = [];
    const assignmentDetails = {};

    for (const caseId of case_ids) {
      assignmentDetails[caseId] = { new_assignments: [], duplicates: [] };

      for (const memberId of member_ids) {
        const key = `${caseId}-${memberId}`;
        if (existingAssignmentMap.has(key)) {
          duplicateAssignments.push({
            case_id: caseId,
            council_user_id: memberId,
          });
          assignmentDetails[caseId].duplicates.push(memberId);
        } else {
          newAssignments.push({
            case_id: caseId,
            council_user_id: memberId,
            assigned_by,
            assigned_at: new Date(),
            is_voted: false,
            created_at: new Date(),
            updated_at: new Date(),
          });
          assignmentDetails[caseId].new_assignments.push(memberId);
        }
      }
    }

    if (newAssignments.length === 0 && duplicateAssignments.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error:
          "All selected members are already assigned to the selected cases",
        duplicate_assignments: duplicateAssignments,
        assignment_details: assignmentDetails,
      });
    }

    let createdAssignments = [];
    if (newAssignments.length > 0) {
      createdAssignments = await CaseDecisionVotes.bulkCreate(newAssignments, {
        transaction: t,
        returning: true,
      });
    }

    // Send notifications
    const notificationPromises = [];
    const councilHead = await User.findByPk(assigned_by, { transaction: t });
    for (const assignment of newAssignments) {
      const caseRecord = cases.find((c) => c.case_id === assignment.case_id);
      if (caseRecord) {
        notificationPromises.push(
          Notification.create(
            {
              case_id: assignment.case_id,
              complaint_id: caseRecord.disciplinary_complaint_id,
              recipient_user_id: assignment.council_user_id,
              sender_id: assigned_by,
              type: "in_app",
              title: "New Case Assigned for Review",
              message: `You have been assigned by ${
                councilHead?.full_name || "Council Head"
              } to review case ${
                caseRecord.case_number
              }. Please submit your decision.`,
              is_read: false,
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction: t }
          )
        );
      }
    }

    await Promise.all(notificationPromises);

    await t.commit();

    const response = {
      success: true,
      message: "Members assigned to selected cases successfully",
      summary: {
        total_cases: case_ids.length,
        total_members: member_ids.length,
        new_assignments: newAssignments.length,
        duplicate_assignments: duplicateAssignments.length,
        skipped_cases:
          duplicateAssignments.length > 0
            ? case_ids.filter(
                (caseId) =>
                  duplicateAssignments.filter((d) => d.case_id === caseId)
                    .length === member_ids.length
              )
            : [],
      },
      details: assignmentDetails,
      new_assignments: createdAssignments.map((a) => ({
        case_id: a.case_id,
        council_user_id: a.council_user_id,
        assigned_by: a.assigned_by,
        assigned_at: a.assigned_at,
      })),
      duplicates: duplicateAssignments,
    };

    if (duplicateAssignments.length > 0) {
      response.warning = `${duplicateAssignments.length} assignments were skipped because members were already assigned`;
    }

    return res.status(200).json(response);
  } catch (error) {
    await t.rollback();
    console.error("Assign multiple members error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get assigned members for a specific case
exports.getAssignedMembersForCase = async (req, res) => {
  try {
    const { case_id } = req.params;

    const assignments = await CaseDecisionVotes.findAll({
      where: { case_id },
      include: [
        {
          model: User,
          as: "councilMember",
          attributes: ["user_id", "full_name", "email", "department_id"],
        },
        {
          model: StatusWithAgenda,
          as: "decisionStatus",
          attributes: ["status_id", "name"],
        },
      ],
      order: [["assigned_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching assigned members:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Assign council members to a case
exports.assignMembersToCase = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { case_id } = req.params;
    const { member_ids } = req.body;
    const assigned_by = req.user?.id; // Council Head ID

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "member_ids array is required and must not be empty",
      });
    }

    // Check if case exists and is in correct status
    const caseRecord = await Case.findByPk(case_id, { transaction: t });
    if (!caseRecord) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    if (caseRecord.status !== "under_council_review") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Case is not in council review stage",
      });
    }

    // Check if members are already assigned
    const existingAssignments = await CaseDecisionVotes.findAll({
      where: {
        case_id,
        council_user_id: member_ids,
      },
      transaction: t,
    });

    // Separate members who have voted vs not
    const alreadyVotedMembers = existingAssignments
      .filter((a) => a.is_voted)
      .map((a) => a.council_user_id);

    const alreadyAssignedMembers = existingAssignments
      .filter((a) => !a.is_voted)
      .map((a) => a.council_user_id);

    if (alreadyVotedMembers.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Cannot reassign members who have already voted",
        membersWhoVoted: alreadyVotedMembers,
      });
    }

    if (alreadyAssignedMembers.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Some council members are already assigned to this case",
        membersAlreadyAssigned: alreadyAssignedMembers,
      });
    }

    // Validate council members exist
    const councilMembers = await User.findAll({
      where: {
        user_id: member_ids,
        account_status: true,
      },
      transaction: t,
    });

    if (councilMembers.length !== member_ids.length) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "One or more council members not found",
      });
    }

    // Prepare assignments
    const assignments = member_ids.map((council_user_id) => ({
      case_id,
      council_user_id,
      assigned_at: new Date(),
      is_voted: false,
      assigned_by,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // Bulk create assignments
    const createdAssignments = await CaseDecisionVotes.bulkCreate(assignments, {
      transaction: t,
      returning: true,
    });

    // Send notifications to assigned council members
    for (const memberId of member_ids) {
      await Notification.create(
        {
          case_id,
          complaint_id: caseRecord.disciplinary_complaint_id,
          recipient_user_id: memberId,
          sender_id: assigned_by,
          type: "in_app",
          title: "New Case Assigned for Review",
          message: `You have been assigned to review case ${caseRecord.case_number}. Please submit your decision.`,
          is_read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t }
      );
    }

    // Log the action
    await Log.create(
      {
        case_id,
        reference_id: caseRecord.disciplinary_complaint_id,
        user_log_id: assigned_by,
        action: "COUNCIL_MEMBERS_ASSIGNED",
        description: `Assigned ${createdAssignments.length} council members to case`,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${createdAssignments.length} council members to the case`,
      data: createdAssignments,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error assigning council members:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Remove members from a case
exports.removeMembersFromCase = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { case_id, council_member_ids } = req.body;
    const removed_by = req.user?.id;

    if (!council_member_ids || !Array.isArray(council_member_ids)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "council_member_ids array is required",
      });
    }

    // Find members who are assigned to this case
    const assignments = await CaseDecisionVotes.findAll({
      where: {
        case_id,
        council_user_id: council_member_ids,
      },
      transaction: t,
    });

    if (!assignments || assignments.length === 0) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "No matching council members found for this case",
      });
    }

    // Filter out members who have already voted
    const membersNotVoted = assignments
      .filter((a) => !a.is_voted)
      .map((a) => a.council_user_id);

    const membersVoted = assignments
      .filter((a) => a.is_voted)
      .map((a) => a.council_user_id);

    if (membersNotVoted.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Cannot remove council members who have already voted",
        votedMembers: membersVoted,
      });
    }

    // Delete only members who haven't voted
    const deletedCount = await CaseDecisionVotes.destroy({
      where: {
        case_id,
        council_user_id: membersNotVoted,
      },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully removed ${deletedCount} council members from the case`,
      removedMembers: membersNotVoted,
      notRemovedMembers: membersVoted,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error removing council members:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get disciplinary cases that have a CaseDecision (for letter generation)
 * These are cases where the council has made a final decision
 */
exports.getDisciplinaryCasesWithDecision = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Find Cases that have:
    // 1. A disciplinary_complaint_id (are disciplinary cases)
    // 2. A CaseDecision record
    const { count, rows } = await Case.findAndCountAll({
      where: {
        disciplinary_complaint_id: { [Op.ne]: null },
      },
      include: [
        {
          model: CaseDecision,
          as: "decision",
          required: true,
          include: [
            {
              model: StatusWithAgenda,
              as: "status",
              attributes: ["status_id", "name", "decision_type"],
            },
          ],
        },
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["full_name", "email", "phone_number"],
            },
            {
              model: DisciplinaryComplaintIssue,
              as: "issues",
              attributes: ["issue_id", "description"],
              separate: true,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalCount: count,
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching disciplinary cases with decision:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
