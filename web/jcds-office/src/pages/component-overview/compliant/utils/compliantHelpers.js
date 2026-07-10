// Determines if the user has any of the required permissions.
export const hasPermission = (permissionsList, requiredPermission) => {
  const permissionList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return permissionList.some(({ resource, action }) =>
    permissionsList.some((permission) => permission.resource === resource && permission.action === action)
  );
};

// Normalizes API/network errors into a short, user-friendly message.
export const getErrorMessage = (error, defaultMessage) => {
  if (!error) return defaultMessage;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('timeout')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
    if (msg.includes('401') || msg.includes('unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }
    if (msg.includes('403') || msg.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return 'The requested item could not be found.';
    }
    if (msg.includes('500') || msg.includes('server error')) {
      return 'A server error occurred. Please try again later.';
    }
    return error.message.length < 100 ? error.message : defaultMessage;
  }

  return defaultMessage;
};

// Returns a readable status label for complaint/case statuses.
export const getStatusLabel = (status, caseStatus) => {
  const normalizedCaseStatus = (caseStatus || '').toLowerCase();
  if (normalizedCaseStatus === 'returned_to_office') {
    return 'Returned';
  }

  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'under_investigation':
      return 'Under Investigation';
    case 'accepted':
    case 'approved':
      return 'Approved';
    case 'under_council_review':
      return 'Under Review';
    case 'decided':
      return 'Closed';
    case 'rejected':
      return 'Rejected';
    case 'returned':
      return 'Returned';
    default: {
      const pretty = normalized.replace(/_/g, ' ');
      return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : 'Pending';
    }
  }
};

// Builds full file URL using environment base with safe fallbacks.
export const getFullFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}/${url}`;
};

