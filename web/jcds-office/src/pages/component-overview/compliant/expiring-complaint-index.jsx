import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  IconButton
} from "@mui/material";
import { Close, Flag } from "@mui/icons-material";
import compliantRequestService from "../../../service/compliantRequest.service";

export default function ComplaintExpiryCases({ showOnlyExpiring = false, onHasExpiring }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [expiringCount, setExpiringCount] = useState(0);
  const [showAlarm, setShowAlarm] = useState(false);

  const fetchExpiring = async () => {
    setLoading(true);
    try {
      const res = await compliantRequestService.getExpiringComplaint();

      const data = res.data?.map((item, index) => {
        const createdDate = item.created_at || item.created_at;
        return {
          complaint_id: item.complaint_id || index,
          judge_name: item.judge_name,
          court_office: item.judge_court,
          file_number: item.case_file_number,
          created_at: createdDate
            ? new Date(createdDate).toISOString().split("T")[0]
            : "N/A",
          isExpired: item.isExpired,
          isNearExpire: item.isNearExpire,
        };
      }) || [];

      const filtered = showOnlyExpiring
        ? data.filter(x => x.isExpired || x.isNearExpire)
        : data;

      // Sort oldest → newest
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setRows(filtered);

      if (onHasExpiring) {
        const hasExpiringCases = filtered.length > 0;
        onHasExpiring(hasExpiringCases);
      }

      const count = filtered.filter(c => c.isNearExpire || c.isExpired).length;
      if (count > 0) {
        setExpiringCount(count);
        setShowAlarm(true);
      }

    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: "Unable to load expiring complaints. Please refresh the page.", 
        severity: "error" 
      });
      if (onHasExpiring) onHasExpiring(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpiring(); }, []);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Main card container (same as DisciplinaryCaseReports) */}
      <Box
        sx={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.2), rgb(255,255,255), rgb(253,240,240))",
          borderRadius: 2,
          p: 2,
          maxWidth: "90%",
          maxHeight: "500px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title identical */}
        <Typography
          sx={{
            fontFamily: "Filson Pro, sans-serif",
            fontWeight: 600,
            fontSize: "1.1rem",
            color: "rgb(16, 32, 61)",
            mb: 2,
          }}
        >
          Complaints reaching expiring date
        </Typography>

        {/* Scrollable list */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            pr: 0.5,

            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-track": {
              background: "rgba(0,0,0,0.1)",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.3)",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(0,0,0,0.5)",
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : rows.length > 0 ? (
            rows.map((item) => (
              <Box
                key={item.complaint_id}
                sx={{
                  height: "36px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#000",
                  borderRadius: 2,
                  px: 1.2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  boxShadow: "inset 0 0 6px rgba(255,255,255,0.1)",
                  border: item.isExpired
                    ? "2px solid #D32F2F"
                    : "2px solid rgb(15,17,37)",
                  overflow: "hidden",
                  minHeight: "36px",
                }}
              >
                <Flag
                  sx={{
                    fontSize: 16,
                    color: item.isExpired
                      ? "rgb(209, 9, 9)"
                      : "rgb(209, 9, 9)",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    gap: 0.7,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "0.75rem",
                    flex: 1,
                  }}
                >
                  <span><b>{item.judge_name}</b></span>
                  <span>| {item.file_number}</span>
                  <span>| {item.created_at}</span>
                </Box>
              </Box>
            ))
          ) : (
            <Box
              sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}
            >
              <Typography sx={{ textAlign: "center", color: "gray" }}>
                No expiring complaints found
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

       {/* Alarm Card - right side, vertically centered */}
        {showAlarm && (
            <Box
            sx={{
                position: "fixed",
                right: 10,
                top: "20%",
                transform: "translateY(-50%)",
                zIndex: 9999,
            }}
            >
            <Alert
                severity="warning"
                sx={{ width: 300, borderRadius: 2, boxShadow: 3 }}
                action={
                <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setShowAlarm(false)}
                >
                    <Close fontSize="inherit" />
                </IconButton>
                }
            >
                You have {expiringCount} case{expiringCount > 1 ? "s" : ""} 
                , reaching expiry! Please Get them fast.
            </Alert>
            </Box>
        )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
