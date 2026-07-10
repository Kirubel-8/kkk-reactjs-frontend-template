/**
 * Check if a value is valid (non-null, non-empty, not just whitespace)
 */
export const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Check if a name represents an anonymous user
 */
export const isAnonymous = (name) => {
  if (!name || typeof name !== 'string') return false;
  return name.toLowerCase().startsWith('anonymous');
};

/**
 * Maps status to color (aligned with compliant_index)
 */
export const getStatusColor = (status) => {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'under_investigation':
    case 'under investigation':
    case 'pending':
      return '#f1bf78ff';
    case 'accepted':
    case 'approved':
      return '#0d6f4e';
    case 'under_council_review':
    case 'under review':
      return '#2196f3';
    case 'decided':
    case 'closed':
      return '#0d6f4e';
    case 'rejected':
      return '#d9534f';
    case 'returned':
      return '#f39c12';
    default: {
      const raw = normalized || 'pending';
      const pretty = raw.replace(/_/g, ' ');
      return '#777';
    }
  }
};
