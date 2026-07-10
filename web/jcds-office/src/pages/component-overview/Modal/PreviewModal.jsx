import { Dialog, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const PreviewModal = ({ isOpen, onClose, documentUrl, onApprove, onReject }) => {
  const handleApprove = () => {
    if (onApprove) {
      onApprove();
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          Document Preview
        </Typography>
        {documentUrl ? (
          <iframe
            src={documentUrl}
            style={{
              width: '100%',
              height: '80vh',
              border: 'none',
            }}
            title="Document Preview"
          />
        ) : (
          <Typography variant="body2" color="textSecondary">
            No document available to preview.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
        <Button onClick={handleApprove} color="success" variant="contained">
          Approve
        </Button>
        <Button onClick={handleReject} color="error" variant="contained">
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewModal;
