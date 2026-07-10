// Lightweight assertions for complaintCaseStatusHelper.
// This is intentionally minimal and can be run with:
//   node api/JCDS-API/utils/complaintCaseStatusHelper.test.js

const assert = require("assert");
const {
  COMPLAINT_STATUS,
  CASE_STATUS,
  transitionFromOfficeAction,
  transitionFromHeadAction,
  transitionCaseDecision,
} = require("./complaintCaseStatusHelper");

function runTests() {
  // Office: pending -> under_investigation when expert "gets" complaint
  const t1 = transitionFromOfficeAction({
    currentComplaintStatus: COMPLAINT_STATUS.PENDING,
    action: "get",
  });
  assert.strictEqual(
    t1.complaintStatus,
    COMPLAINT_STATUS.UNDER_INVESTIGATION,
    "pending + get should go to under_investigation"
  );

  // Office: under_investigation -> accepted on accept
  const t2 = transitionFromOfficeAction({
    currentComplaintStatus: COMPLAINT_STATUS.UNDER_INVESTIGATION,
    action: "accept",
  });
  assert.strictEqual(
    t2.complaintStatus,
    COMPLAINT_STATUS.ACCEPTED,
    "under_investigation + accept should go to accepted"
  );

  // Council head: accepted -> under_council_review + open
  const t3 = transitionFromHeadAction({
    currentComplaintStatus: COMPLAINT_STATUS.ACCEPTED,
    currentCaseStatus: CASE_STATUS.OPEN,
    action: "approve_for_council",
  });
  assert.strictEqual(
    t3.complaintStatus,
    COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW,
    "accepted + approve_for_council should go to under_council_review"
  );
  assert.strictEqual(
    t3.caseStatus,
    CASE_STATUS.OPEN,
    "case should remain open after council approval"
  );

  // Council head: reject_to_office should return case status returned_to_office
  const t3b = transitionFromHeadAction({
    currentComplaintStatus: COMPLAINT_STATUS.ACCEPTED,
    currentCaseStatus: CASE_STATUS.OPEN,
    action: "reject_to_office",
  });
  assert.strictEqual(
    t3b.complaintStatus,
    COMPLAINT_STATUS.UNDER_INVESTIGATION,
    "reject_to_office should send complaint back to under_investigation"
  );
  assert.strictEqual(
    t3b.caseStatus,
    CASE_STATUS.RETURNED_TO_OFFICE,
    "reject_to_office should mark case as returned_to_office"
  );

  // Council decision: under_council_review + open -> Decided + closed
  const t4 = transitionCaseDecision({
    currentComplaintStatus: COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW,
    currentCaseStatus: CASE_STATUS.OPEN,
  });
  assert.strictEqual(
    t4.complaintStatus,
    COMPLAINT_STATUS.DECIDED,
    "under_council_review + decision should go to Decided"
  );
  assert.strictEqual(
    t4.caseStatus,
    CASE_STATUS.CLOSED,
    "decision should close the case"
  );

  // Return path: returned + customer update -> under_investigation
  const t5 = transitionFromOfficeAction({
    currentComplaintStatus: COMPLAINT_STATUS.RETURNED,
    action: "customer_update_returned",
  });
  assert.strictEqual(
    t5.complaintStatus,
    COMPLAINT_STATUS.UNDER_INVESTIGATION,
    "returned + customer_update_returned should go to under_investigation"
  );

  // If we reach here, basic expectations hold.
  // eslint-disable-next-line no-console
  console.log("complaintCaseStatusHelper tests passed");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };





