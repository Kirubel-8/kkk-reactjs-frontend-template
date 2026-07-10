import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { Flag, Close } from "@mui/icons-material";
import disciplineCaseService from "../../../service/disciplinary.service";

export default function DisciplinaryCaseReports({ showOnlyExpiring = false, onHasExpiring }) {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [expiringCount, setExpiringCount] = useState(0);
  const [showAlarm, setShowAlarm] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await disciplineCaseService.getExpiringDisciplinary();
      
      const data = res.data.map((item, index) => ({
        disp_Id: item.disciplinary_complaint_id || index,
        judge_name: item.judge_name,
        court_office: item.court_office,
        file_number: item.file_number,
        createdAt: new Date(item.createdAt).toISOString().split("T")[0],
        isExpired: item.isExpired,
        isNearExpire: item.isNearExpire,
      }));

      const filtered = showOnlyExpiring
        ? data.filter((x) => x.isExpired || x.isNearExpire)
        : data;

      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setRows(filtered);
      setFilteredRows(filtered);

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
      console.error("Error fetching cases:", err);
      setRows([]);
      setFilteredRows([]);
      setSnackbar({
        open: true,
        message: "Error fetching cases.",
        severity: "error",
      });
      if (onHasExpiring) onHasExpiring(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <Box sx={{ width: "100%", p: 2, position: "relative" }}>
      {/* Main card */}
      <Box
        sx={{
          background: "linear-gradient(160deg,rgba(255, 255, 255, 0.2), rgb(255, 255, 255), rgb(253, 240, 240))",
          borderRadius: 2,
          p: 2,
          maxWidth: "90%",
          maxHeight: "500px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          sx={{ 
            fontFamily: 'Filson Pro, sans-serif',
            fontWeight: 600, 
            fontSize: "1.1rem", 
            color: "rgb(16, 32, 61)", 
            mb: 2,
          }}
        >
          Disciplinary cases reach expiring date
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            pr: 0.5,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.1)', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.3)', borderRadius: '3px' },
            '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.5)' },
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : filteredRows.length > 0 ? (
            filteredRows.map((item) => (
              <Box
                key={item.disp_Id}
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
                  border: item.isExpired ? "2px solid #D32F2F" : "2px solid rgb(15, 17, 37)",
                  overflow: "hidden",
                  minHeight: "36px",
                }}
              >
                <Flag sx={{ fontSize: 16, color: item.isExpired ? "rgb(209, 9, 9)" : "rgb(209, 9, 9)" }} />
                <Box sx={{ display: "flex", gap: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.75rem", flex: 1 }}>
                  <span><b>{item.judge_name}</b></span>
                  <span>| {item.file_number}</span>
                  <span>| {item.createdAt}</span>
                </Box>
              </Box>
            ))
          ) : (
            !loading && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
                <Typography sx={{ textAlign: "center", color: "gray" }}>
                  No expiring cases found
                </Typography>
              </Box>
            )
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
