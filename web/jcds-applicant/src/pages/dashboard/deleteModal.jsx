import { TrashIcon } from "@heroicons/react/24/solid"; // Import the TrashIcon from heroicons
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: theme.spacing(3),
        }}
      >
        <Box
          sx={{
            color: theme.palette.error.main,
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: theme.spacing(2),
          }}
        >
          <TrashIcon sx={{ fontSize: 24 }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            marginBottom: theme.spacing(1),
          }}
          id="confirmation-dialog-title"
        >
          {title}
        </Typography>

        <Typography
          color="textSecondary"
          sx={{
            marginBottom: theme.spacing(2),
            lineHeight: 1.5,
          }}
          id="confirmation-dialog-description"
        >
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          paddingBottom: theme.spacing(2),
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{
            marginRight: theme.spacing(1),
            textTransform: "capitalize",
            padding: "8px 24px",
            borderRadius: 2,
            fontWeight: "500",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              boxShadow: theme.shadows[2],
            },
          }}
        >
          {cancelText}
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            padding: "8px 24px",
            borderRadius: 2,
            fontWeight: "500",
            "&:hover": {
              backgroundColor: theme.palette.error.dark,
              boxShadow: theme.shadows[3],
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
