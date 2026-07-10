import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import requestService from "@/service/request.service";
import inRequestService from "../../../../cci/src/service/inRequest.service";
import { default as RequestService } from "../../../../cci/src/service/request.service";
import RequestedFileService from "../../service/requested-file.service";

const InternalRequestHandler = ({
  caseId,
  request_id,
  internal_request_status,
  type,
}) => {
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [existingData, setExistingData] = useState(null);
  const [dataExists, setDataExists] = useState(false);
  const [internalRequestStatus, setInternalRequestStatus] = useState("");
  const [showTextField, setShowTextField] = useState(false);
  const [customerNote, setNote] = useState("");
  // const [selectedFile, setSelectedFile] = useState(null);
  // const [documentType, setDocumentType] = useState("representation letter");
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);

  // const { requestId } = location.state?.request_id;
  // const { caseId } = location.state?.case_id;
  console.log("kk3", caseId, request_id, internal_request_status);

  useEffect(() => {
    const fetchRejectionReasons = async () => {
      try {
        const reasons = await RequestService.getAllRejectionReasons();
        setRejectionReasons(reasons);
      } catch (error) {
        console.error("Error fetching rejection reasons:", error);
      }
    };
    fetchRejectionReasons();
  }, []);

  // const openModal = () => {
  //   setIsModalOpen(true);
  // };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const openModal = async () => {
    setIsModalOpen(true);

    try {
      const response = await inRequestService.checkExistingData(caseId);
      if (response.exists) {
        setExistingData(response.existingData);
        setDataExists(true);
        setSnackbar({
          open: true,
          message:
            "Data already exists for this case. Proceeding will update the existing data.",
          severity: "warning",
        });
      } else {
        setDataExists(false);
      }
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Failed to check existing data.",
        severity: "error",
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setRejectionReason("");
    setComment("");
    setExistingData(null);
    setDataExists(false);
  };

  const handleRejectionChange = (event) => {
    const selectedId = event.target.value;
    setRejectionReason(selectedId);
    setError("");
  };

  const handleSubmitInrequest = async () => {
    console.log("k Case ID:", caseId);
    if (!rejectionReason) {
      setError("Please select a rejection reason.");
      return;
    }

    const inRequestData = {
      case_id: caseId,
      rejection_reason_id: rejectionReason,
      comment: comment || "",
    };

    try {
      const indata = await inRequestService.CreateInrequestForCase(
        caseId,
        inRequestData
      );
      setSnackbar({
        open: true,
        message: "Case rejection reason and comment submitted successfully!",
        severity: "success",
      });
      closeModal();
    } catch (error) {
      console.error(error.message);
      setSnackbar({
        open: true,
        message:
          error.response?.data.error ||
          "Failed to submit rejection reason and comment",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    const fetchInRequestDetails = async () => {
      try {
        const response = await requestService.getInrequestForCase(caseId);
        const details = response.data;
        console.log("Fetched details:", details);

        setInternalRequestStatus(details.internal_request_status || "Unknown");
        setComment(details.comment || "N/A");
        setAdditionalDetails(details);
      } catch (error) {
        console.error("Failed to fetch details:", error);
        setInternalRequestStatus("");
      }
    };

    fetchInRequestDetails();
  }, [caseId]);

  const handleChipClick = async () => {
    try {
      setLoading(true);
      const dataa = await requestService.getInrequestForCase(caseId);
      console.log("API Response:", dataa);

      const details = dataa.data;
      console.log("Details 2:", details, caseId);

      setComment(details.comment || "N/A");
      setAdditionalDetails(details);
      setOpen(true);
    } catch (error) {
      console.error("Failed to fetch details:", error);
      setComment("");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowTextField(false);
    setOpen(false);
  };

  // Fetch existing files when opening the modal
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await RequestedFileService.getRequestedFiles(
          additionalDetails.request_id
        );
        setExistingFiles(response.documents);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    }
    if (additionalDetails?.request_id) {
      fetchFiles();
    }
  }, [additionalDetails]);

  // const handleFileChange = (e) => {
  //   setFiles([...e.target.files]);
  // };
  const handleFileChange = (event) => {
    const selectedFiles = event.target.files;
    setFiles(Array.from(selectedFiles)); // Converts FileList to an Array
  };

  // const handleRemoveFile = (fileName) => {
  //   setFilesToRemove([...filesToRemove, fileName]);
  //   setExistingFiles(existingFiles.filter(file => file !== fileName));
  // };
  const handleRemoveFile = async (fileName) => {
    try {
      const response = await RequestedFileService.removeFile(
        additionalDetails.request_id,
        fileName
      );
      setFilesToRemove(files.filter((file) => file !== fileName));
      setFilesToRemove([]);
      setSnackbar({
        open: true,
        message: "File removed successfully!",
        severity: "success",
      });
      handleClose();
    } catch (error) {
      console.error("Upload error:", error.message);
      setFilesToRemove([]);
      setSnackbar({
        open: true,
        message: error.response?.data.error || "Failed to remove file",
        severity: "warning",
      });
      handleClose();
    }
  };

  const handleSendClick = () => {
    if (!showTextField) {
      setShowTextField(true);
    } else {
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!additionalDetails?.request_id) {
      console.error("request_id is missing!");
      return;
    }

    const formData = new FormData();
    formData.append("request_id", additionalDetails.request_id);
    formData.append("caseId", caseId);
    formData.append("document_type", "complaint document");
    // formData.append("customerNote", customerNote);
    formData.append("customerNote", customerNote || "");
    formData.append("created_by", additionalDetails.created_by);

    if (files.length === 0) {
      console.error("No files selected!");
      return;
    }
    console.log("Files to upload:", formData, files);

    files.forEach((file) => {
      console.log("k b Appending file:", file.name);
      formData.append("files", file, file.name);
      console.log("k Appending file:", file.name);
    });

    try {
      const response = await RequestedFileService.uploadFiles(formData);

      setSnackbar({
        open: true,
        message: "File uploaded succesfull!",
        severity: "success",
      });
      setFiles([]);
      setNote("");
      handleClose();
    } catch (error) {
      console.error("Upload error:", error.message);
      setSnackbar({
        open: true,
        message: error.response?.data.error || "File upload failed.",
        severity: "warning",
      });
      setNote("");
      setFiles([]);
      handleClose();
    }
  };

  if (type === "status") {
    return (
      <>
        {internalRequestStatus && (
          <Grid
            item
            xs={12}
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Typography variant="body2" color="textSecondary">
              Inrequest
            </Typography>
            <Tooltip title="Click to view details" arrow>
              <Chip
                label={internalRequestStatus}
                color={
                  internalRequestStatus === "waiting additional file"
                    ? "primary"
                    : "default"
                }
                size="small"
                onClick={handleChipClick}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor:
                      internalRequestStatus === "waiting additional file"
                        ? "#1976d2"
                        : "#f0f0f0",
                    opacity: 0.8,
                  },
                  boxShadow: 2,
                }}
              />
            </Tooltip>
          </Grid>
        )}

        <Dialog
          open={open}
          onClose={handleClose}
          sx={{
            "& .MuiDialog-paper": {
              minWidth: "400px",
              minHeight: "200px",
              width: "auto",
              height: "auto",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              padding: "20px",
            },
          }}
        >
          <DialogTitle
            sx={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "bold" }}
          >
            Internal Request Details
          </DialogTitle>
          <DialogContent>
            {loading ? (
              <Typography
                variant="body1"
                color="textPrimary"
                sx={{ textAlign: "center" }}
              >
                Loading...
              </Typography>
            ) : (
              <>
                <Typography
                  variant="h6"
                  color="textPrimary"
                  sx={{ marginBottom: "8px", fontWeight: "bold" }}
                >
                  Reason:
                </Typography>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{ marginBottom: "12px" }}
                >
                  {additionalDetails?.RejectionReasons?.reason ||
                    "No reason available."}
                </Typography>
                <Typography
                  variant="h6"
                  color="textPrimary"
                  sx={{ marginBottom: "8px", fontWeight: "bold" }}
                >
                  Description for Customer:
                </Typography>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{ marginBottom: "12px" }}
                >
                  {additionalDetails?.descriptionCustomer || "Nothing"}
                </Typography>

                {internalRequestStatus !== "File Attached" && (
                  <>
                    <Typography
                      variant="h6"
                      sx={{ marginBottom: "8px", fontWeight: "bold" }}
                    >
                      Upload File:
                    </Typography>
                    {/* Display previously uploaded files */}
                    {existingFiles.length > 0 && (
                      <div>
                        <Typography variant="body1">Existing Files:</Typography>
                        {existingFiles.map((file) => (
                          <div key={file.requested_file_id}>
                            <Typography variant="body1">
                              {file.request_document_url
                                .split("/")
                                .pop()
                                .replace(/_/g, " ")}
                            </Typography>
                            <Button
                              color="secondary"
                              onClick={() =>
                                handleRemoveFile(file.request_document_url)
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="file"
                      name="files"
                      multiple
                      onChange={handleFileChange}
                    />
                    {showTextField && (
                      <TextField
                        fullWidth
                        label="Additional Details (Optional)"
                        multiline
                        rows={3}
                        value={customerNote}
                        onChange={(e) => setNote(e.target.value)}
                        sx={{ marginTop: "12px" }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
            {internalRequestStatus !== "File Attached" && (
              <Button onClick={handleSendClick} color="primary">
                {showTextField ? "Send to Registrar" : "Add Note & Send"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  } else if (type === "form") {
    return (
      <>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              color="error"
              onClick={openModal}
              disabled={loading}
            >
              Open Internal Request Form
            </Button>
          </Box>
        </Grid>

        <Modal
          open={isModalOpen}
          onClose={closeModal}
          aria-labelledby="internal-request-modal-title"
          aria-describedby="internal-request-modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "60%",
              left: "55%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
            }}
          >
            <Typography
              id="internal-request-modal-title"
              variant="h6"
              component="h2"
              sx={{ mb: 2 }}
            >
              Internal Request
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="rejection-reason-label">
                Rejection Reason
              </InputLabel>
              <Select
                labelId="rejection-reason-label"
                value={rejectionReason || ""}
                onChange={handleRejectionChange}
                label="Rejection Reason"
              >
                {rejectionReasons.length > 0 ? (
                  rejectionReasons.map((reason) => (
                    <MenuItem
                      key={reason.rejection_reason_id}
                      value={reason.rejection_reason_id}
                    >
                      {reason.reason}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No reasons available</MenuItem>
                )}
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                id="comment"
                label="Comment"
                multiline
                rows={4}
                placeholder="Add additional comments..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Box>

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitInrequest}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </Modal>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  } else {
    return null;
  }
};

export default InternalRequestHandler;
