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
          padding: "clamp(20px,3vw,28px)",
        }}
      >
        <Box
          sx={{
            color: theme.palette.error.main,
            width: "clamp(32px,4vw,44px)",
            height: "clamp(32px,4vw,44px)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "clamp(12px,2vw,16px)",
          }}
        >
          <TrashIcon sx={{ fontSize: "clamp(20px,3vw,24px)" }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            marginBottom: "clamp(8px,1.5vw,12px)",
            fontFamily: "Montserrat",
            fontSize: "clamp(16px,1.1vw,20px)",
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
            fontFamily: "Montserrat",
            fontSize: "clamp(13px,1vw,15px)",
          }}
          id="confirmation-dialog-description"
        >
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          paddingBottom: "clamp(12px,2vw,16px)",
          gap: "clamp(8px,1.2vw,12px)",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{
            marginRight: 0,
            textTransform: "capitalize",
            padding: "clamp(8px,1.2vh,10px) clamp(20px,3vw,28px)",
            borderRadius: 2,
            fontWeight: "500",
            fontFamily: "Montserrat",
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
            padding: "clamp(8px,1.2vh,10px) clamp(20px,3vw,28px)",
            borderRadius: 2,
            fontWeight: "500",
            fontFamily: "Montserrat",
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
