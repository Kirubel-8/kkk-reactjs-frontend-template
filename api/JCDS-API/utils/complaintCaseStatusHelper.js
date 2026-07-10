/**
 * Centralized helpers for complaint/case status transitions.
 *
 * NOTE:
 * - `Complaint.status` values are customer-facing and constrained by the ENUM in `models/complaint.js`.
 * - `Case.status` is currently used as a simple lifecycle flag (`open` | `closed`).
 *   We keep those values for now and only derive intent from the combination of
 *   complaint status and related records (e.g. ComplaintHasRejection).
 *
 * The goal is to keep all status rules in one place so controllers stay small
 * and the process described in JCDMS_PROCESS is easy to reason about.
 */

const COMPLAINT_STATUS = {
  PENDING: "pending",
  REJECTED: "rejected",
  UNDER_INVESTIGATION: "under_investigation",
  ACCEPTED: "accepted",
  UNDER_COUNCIL_REVIEW: "under_council_review",
  DECIDED: "Decided",
  RETURNED: "returned",
};

const CASE_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  RETURNED_TO_OFFICE: "returned_to_office",
  BACK_TO_COUNCIL: "back_to_council_head",
};

/**
 * Computes the next complaint/case status for an action taken by the Complaint Office.
 *
 * Supported actions:
 * - "get"                     – expert picks up a pending complaint
 * - "accept"                  – office accepts complaint (all evidences approved)
 * - "reject"                  – office rejects complaint
 * - "return"                  – office returns complaint to applicant for changes
 * - "customer_update_returned"– applicant updates a previously returned complaint
 *
 * This function is intentionally tolerant: if an unexpected current status is
 * provided, we return it unchanged and let the caller decide how to react.
 *
 * @param {Object} params
 * @param {string} params.currentComplaintStatus
 * @param {string} [params.currentCaseStatus]
 * @param {"get"|"accept"|"reject"|"return"|"customer_update_returned"} params.action
 * @returns {{ complaintStatus: string, caseStatus?: string }}
 */
function transitionFromOfficeAction({
  currentComplaintStatus,
  currentCaseStatus = null,
  action,
}) {
  if (action === "get") {
    // Complaint Office "gets" a complaint from the queue.
    // pending / returned -> under_investigation
    if (
      currentComplaintStatus === COMPLAINT_STATUS.PENDING ||
      currentComplaintStatus === COMPLAINT_STATUS.RETURNED
    ) {
      return {
        complaintStatus: COMPLAINT_STATUS.UNDER_INVESTIGATION,
        caseStatus: currentCaseStatus || null,
      };
    }
    return {
      complaintStatus: currentComplaintStatus,
      caseStatus: currentCaseStatus,
    };
  }

  if (action === "accept") {
    if (currentComplaintStatus === COMPLAINT_STATUS.UNDER_INVESTIGATION) {
      return {
        complaintStatus: COMPLAINT_STATUS.ACCEPTED,
        caseStatus:
          currentCaseStatus === CASE_STATUS.OPEN
            ? CASE_STATUS.OPEN
            : CASE_STATUS.BACK_TO_COUNCIL,
      };
    }
    return {
      complaintStatus: currentComplaintStatus,
      caseStatus: currentCaseStatus,
    };
  }

  if (action === "reject") {
    // Office permanently rejects the complaint.
    return {
      complaintStatus: COMPLAINT_STATUS.REJECTED,
      caseStatus: currentCaseStatus || null,
    };
  }

  if (action === "return") {
    // Office returns complaint to applicant for edits/clarifications.
    return {
      complaintStatus: COMPLAINT_STATUS.RETURNED,
      caseStatus: currentCaseStatus || null,
    };
  }

  if (action === "customer_update_returned") {
    // Applicant updated a previously returned complaint.
    if (currentComplaintStatus === COMPLAINT_STATUS.RETURNED) {
      return {
        complaintStatus: COMPLAINT_STATUS.UNDER_INVESTIGATION,
        caseStatus: currentCaseStatus || null,
      };
    }
    return {
      complaintStatus: currentComplaintStatus,
      caseStatus: currentCaseStatus,
    };
  }

  // Fallback: no change
  return {
    complaintStatus: currentComplaintStatus,
    caseStatus: currentCaseStatus,
  };
}

/**
 * Computes the next complaint/case status for an action taken by the Council Head.
 *
 * Supported actions:
 * - "approve_for_council" – move accepted complaint to under_council_review and ensure case is open
 * - "reject_to_office"    – send complaint back to Complaint Office for further investigation
 *
 * @param {Object} params
 * @param {string} params.currentComplaintStatus
 * @param {string|null} [params.currentCaseStatus]
 * @param {"approve_for_council"|"reject_to_office"} params.action
 * @returns {{ complaintStatus: string, caseStatus: string }}
 */
function transitionFromHeadAction({
  currentComplaintStatus,
  currentCaseStatus = CASE_STATUS.OPEN,
  action,
}) {
  if (action === "approve_for_council") {
    // Only sensible from accepted; keep other statuses unchanged for safety.
    if (currentComplaintStatus === COMPLAINT_STATUS.ACCEPTED) {
      return {
        complaintStatus: COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW,
        caseStatus: CASE_STATUS.OPEN,
      };
    }
    return {
      complaintStatus: currentComplaintStatus,
      caseStatus: currentCaseStatus,
    };
  }

  if (action === "reject_to_office") {
    // Send back for further investigation (case is marked as returned to office).
    return {
      complaintStatus: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      caseStatus: CASE_STATUS.RETURNED_TO_OFFICE,
    };
  }

  return {
    complaintStatus: currentComplaintStatus,
    caseStatus: currentCaseStatus,
  };
}

/**
 * Computes the final complaint/case statuses after a council decision is made.
 *
 * For now this is a simple:
 *   under_council_review + open -> Decided + closed
 *
 * @param {Object} params
 * @param {string} params.currentComplaintStatus
 * @param {string} params.currentCaseStatus
 * @returns {{ complaintStatus: string, caseStatus: string }}
 */
function transitionCaseDecision({ currentComplaintStatus, currentCaseStatus }) {
  if (
    currentComplaintStatus === COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW &&
    currentCaseStatus === CASE_STATUS.OPEN
  ) {
    return {
      complaintStatus: COMPLAINT_STATUS.DECIDED,
      caseStatus: CASE_STATUS.CLOSED,
    };
  }

  // Fallback: no change; decision controllers should already guard invalid states.
  return {
    complaintStatus: currentComplaintStatus,
    caseStatus: currentCaseStatus,
  };
}

/**
 * Derives a couple of simple flags for frontend use based on complaint state.
 *
 * Currently:
 * - isReturnedFromOffice: complaint.status === "returned"
 * - isUnderInvestigation: complaint.status === "under_investigation"
 *
 * @param {import("../models").Complaint | Object} complaintLike
 * @returns {{ isReturnedFromOffice: boolean, isUnderInvestigation: boolean }}
 */
function deriveComplaintFlags(complaintLike) {
  const status = complaintLike?.status;
  return {
    isReturnedFromOffice: status === COMPLAINT_STATUS.RETURNED,
    isUnderInvestigation: status === COMPLAINT_STATUS.UNDER_INVESTIGATION,
  };
}

module.exports = {
  COMPLAINT_STATUS,
  CASE_STATUS,
  transitionFromOfficeAction,
  transitionFromHeadAction,
  transitionCaseDecision,
  deriveComplaintFlags,
};
