/**
 * Utility functions for getting status colors from theme
 * These functions map complaint/case statuses to their corresponding theme colors
 */

/**
 * Returns the status color from theme palette based on status string
 * @param {Object} theme - MUI theme object
 * @param {string} status - Status string (e.g., 'under_investigation', 'accepted', etc.)
 * @param {string} caseStatus - Optional case status for special handling
 * @returns {string} Color hex code
 */
export const getStatusColor = (theme, status, caseStatus = null) => {
  if (!theme?.palette?.status) {
    console.warn('Status colors not found in theme palette');
    return '#777';
  }

  const normalizedCaseStatus = (caseStatus || '').toLowerCase();
  if (normalizedCaseStatus === 'returned_to_office') {
    return theme.palette.status.return;
  }

  const normalized = (status || '').toLowerCase();

  console.log({
    status,
    normalized
  });
  switch (normalized) {
    case 'under_investigation':
      return theme.palette.status.underInvestigation;
    case 'accepted':
    case 'approved':
      return theme.palette.status.accept;
    case 'under_council_review':
      return theme.palette.status.underReview;
    case 'decided':
    case 'closed':
      return theme.palette.status.decided;
    case 'rejected':
      return theme.palette.status.rejected;
    case 'returned':
    case 'returned_to_office':
      return theme.palette.status.return;
    case 'pending':
    case 'submitted':
      return theme.palette.status.pending;
    case 'open':
      return theme.palette.status.accept;
    default:
      return '#777';
  }
};

/**
 * Returns the button color from theme palette based on action type
 * @param {Object} theme - MUI theme object
 * @param {string} action - Action type (e.g., 'accept', 'reject', 'return')
 * @returns {string} Color hex code
 */
export const getButtonColor = (theme, action) => {
  if (!theme?.palette?.statusButtons) {
    console.warn('Status button colors not found in theme palette');
    return '#777';
  }

  const normalized = (action || '').toLowerCase();
  switch (normalized) {
    case 'accept':
    case 'approve':
      return theme.palette.statusButtons.accept;
    case 'reject':
    case 'rejected':
      return theme.palette.statusButtons.rejected;
    case 'return':
    case 'returned':
      return theme.palette.statusButtons.return;
    case 'pending':
      return theme.palette.statusButtons.pending;
    case 'under_investigation':
      return theme.palette.statusButtons.underInvestigation;
    case 'under_review':
      return theme.palette.statusButtons.underReview;
    case 'decided':
    case 'closed':
      return theme.palette.statusButtons.decided;
    default:
      return '#777';
  }
};

/**
 * Returns status label and color for display
 * @param {Object} theme - MUI theme object
 * @param {string} status - Status string
 * @param {string} caseStatus - Optional case status
 * @returns {Object} Object with label and color properties
 */
export const getStatusMeta = (theme, status, caseStatus = null, pendingStatus = null) => {
  console.log({
    status,
    caseStatus,
  })
  const normalizedCaseStatus = (caseStatus || '').toLowerCase();
  if (normalizedCaseStatus === 'returned_to_office') {
    return {
      label: 'Returned',
      color: getStatusColor(theme, 'returned', caseStatus)
    };
  }

  const normalized = (status || '').toLowerCase();
  let label = '';

  // Allow page-level override to present a status as "Pending"
  if (normalized === pendingStatus) {
    return {
      label: 'Pending',
      color: getStatusColor(theme, 'pending', caseStatus)
    };
  }

  switch (normalized) {
    case 'under_investigation':
      label = 'Under Investigation';
      break;
    case 'accepted':
    case 'approved':
      label = 'Approved';
      break;
    case 'under_council_review':
      label = 'Under Review';
      break;
    case 'decided':
      label = 'Closed';
      break;
    case 'rejected':
      label = 'Rejected';
      break;
    case 'returned':
    case 'returned_to_office':
      label = 'Returned';
      break;
    case 'pending':
    case 'submitted':
      label = 'Pending';
      break;
    case 'open':
      label = 'Open';
      break;
    case 'closed':
      label = 'Closed';
      break;
    default: {
      const pretty = normalized.replace(/_/g, ' ');
      label = pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : 'Pending';
    }
  }

  return {
    label,
    color: getStatusColor(theme, status, caseStatus)
  };
};
