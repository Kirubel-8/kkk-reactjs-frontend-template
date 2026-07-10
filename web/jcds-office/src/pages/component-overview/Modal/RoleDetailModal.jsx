import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function RoleDetailModal({ open, onClose, formValues }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.75rem',
          color: 'primary.main',
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: 2
        }}
      >
        Role Details
      </DialogTitle>
      <DialogContent sx={{ padding: '24px 32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Typography variant="h6" component="h3" sx={{ marginBottom: 0.5, fontWeight: 'bold', color: 'text.primary' }}>
            Role Name
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {formValues.name}
          </Typography>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Typography variant="h6" component="h3" sx={{ marginBottom: 0.5, fontWeight: 'bold', color: 'text.primary' }}>
            Description
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {formValues.description}
          </Typography>
        </div>

        {/* Permissions Section */}
        {Object.entries(formValues.permissions || {}).length === 0 ? (
          <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
            No permissions assigned.
          </Typography>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <div style={{ marginTop: '16px' }}>
              <Typography variant="h6" component="h3" sx={{ marginBottom: 2, fontWeight: 'bold', color: 'text.primary' }}>
                Permissions
              </Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {Object.entries(formValues.permissions).map(([resource, permissions]) => (
                  <div
                    key={resource}
                    style={{
                      flex: '1 0 200px',
                      minWidth: '200px',
                      backgroundColor: '#FFF6F6',
                      borderRadius: 12,
                      padding: '16px'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1B254B', marginBottom: 1 }}>
                      {resource}
                    </Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {permissions.map((permName, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#00008B'
                            }}
                          />
                          <Typography sx={{ color: '#1B254B', fontSize: 14 }}>{permName}</Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          padding: '16px',
          borderTop: '1px solid #f0f0f0'
        }}
      >
        <Button
          onClick={onClose}
          color="secondary"
          variant="outlined"
          sx={{
            borderRadius: 2,
            padding: '8px 24px',
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RoleDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    permissions: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string))
  }).isRequired
};
