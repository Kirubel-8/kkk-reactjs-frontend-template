import { Alert, Box, Button, Snackbar } from "@mui/material";
import { FolderOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { default as informExpertService } from "../../../service/informExpert.service";
import { Loading } from "../PageLoading/PageLoading";
import GetHeroLayout from "../../../components/common/GetHeroLayout";

export const GetAssignedCases = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === "success") {
      navigate("/department_assigned_cases");
    }
  };

  const handleGetAssignedCases = async () => {
    const MIN_LOADING_TIME = 1000;
    const MAX_WAIT_TIME = 30000;
    const startTime = Date.now();
    const controller = new AbortController();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      setLoading(true);
      const timeoutId = setTimeout(() => controller.abort(), MAX_WAIT_TIME);

      const data = await informExpertService.getAssignedCases({
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      await delay(remainingTime);

      if (data.data?.cases?.length > 0) {
        const caseItem = data.data.cases[0];
        const department = data.data.department;
        setSnackbar({
          open: true,
          message: data.message || "Assigned cases retrieved successfully.",
          severity: "success",
        });
        navigate("/department_assigned_case_detail", {
          state: { caseItem, department },
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || "No cases assigned to your department.",
          severity: "info",
        });
      }
    } catch (error) {
      console.error("Get Assigned Cases Error:", error);
      setSnackbar({
        open: true,
        message: error.message || "Something went wrong.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {loading && <Loading open={loading} />}
      <GetHeroLayout
        title={t("departmentCommittee.getAssignedCaseTitle", { defaultValue: "Get Assigned Cases" })}
        subtitle={t("departmentCommittee.getAssignedCaseDetail", {
          defaultValue: "Click below to retrieve all cases assigned to your department.",
        })}
        actionLabel={t("departmentCommittee.getAssignedCaseButton", { defaultValue: "Get Cases" })}
        actionIcon={<FolderOutlined style={{ width: 18, height: 18, marginRight: 6 }} />}
        onAction={handleGetAssignedCases}
        loading={loading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GetAssignedCases;
