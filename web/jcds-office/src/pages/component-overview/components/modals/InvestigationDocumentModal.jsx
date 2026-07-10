import CommonModal from '../../components/CommonModal';
import { Box, Button, Divider, Typography } from '@mui/material';
import { getFullFileUrl } from '../../compliant/utils/compliantHelpers';

/**
 * Displays investigation document notes and files.
 */
export const InvestigationDocumentModal = ({ openDoc, onClose }) => (
  <CommonModal
    open={Boolean(openDoc)}
    onClose={onClose}
    title="Investigation Document"
    maxWidth="lg"
    actions={
      <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', fontSize: '14px', py: 1.2 }}>
        Close
      </Button>
    }
    showCloseButton={false}
  >
    {openDoc?.description && (
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '12px', fontWeight: 600 }}>
          Note:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {openDoc.description}
        </Typography>
      </Box>
    )}

    {openDoc?.file_path && (
      <iframe
        src={getFullFileUrl(openDoc.file_path)}
        className="object-fit-contain"
        width="fit-content"
        height="600px"
        title="Investigation Document"
        style={{
          borderRadius: '10px',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          width: '100%'
        }}
      />
    )}
  </CommonModal>
);
