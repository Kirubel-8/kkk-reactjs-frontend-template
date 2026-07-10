import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Checkbox,
  Select,
  Option,
  Typography,
} from "@material-tailwind/react";
import ApplicationService from "@/service/application.service";
import ApplicationFormService from "@/service/applicationForm.service";
import { toast } from "react-toastify";

const ApplicationModal = ({ open, onClose, requestId }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await ApplicationService.getAllApplications();
        setApplications(data);
        console.log("✅ Applications fetched:", data);
      } catch (err) {
        toast.error(err.message);
        console.error("❌ Error fetching applications:", err);
      }
    };
    if (open) fetchApplications();
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedApplicationId("");
      setSelectedApplication(null);
      setAgreedToTerms(false);
    }
  }, [open]);

  const handleApplicationChange = (val) => {
    console.log("📌 Selected applicationId:", val);
    setSelectedApplicationId(val);
    const found = applications.find(
      (app) => String(app.application_id) === String(val)
    );
    console.log("📄 Matched Application:", found);
    setSelectedApplication(found || null);
  };

  const handleSubmit = async () => {
    const formData = {
      application_id: selectedApplicationId,
      request_id: requestId,
      form_data: {},
      agreed_to_terms: true,
    };

    console.log("🚀 Submitting form with data:", formData);

    setIsSubmitting(true);

    try {
      await ApplicationFormService.submitApplicationForm(formData);
      toast.success("Application submitted successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message);
      console.error("❌ Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} handler={onClose} className="p-4">
      <DialogHeader className="text-xl font-semibold text-blue-700">
        📄 Submit Application
      </DialogHeader>

      <DialogBody className="flex flex-col gap-5 text-sm">
        <div>
          <Typography
            variant="small"
            color="blue-gray"
            className="mb-1 font-medium"
          >
            Select Application
          </Typography>
          <Select
            label="Choose application"
            defaultValue={selectedApplicationId || ""}
            onChange={handleApplicationChange}
          >
            {applications.map((app) => (
              <Option
                key={app.application_id}
                value={String(app.application_id)}
              >
                {app.name || app.application_id}
              </Option>
            ))}
          </Select>
        </div>

        {selectedApplication?.description && (
          <div className="p-3 bg-gray-100 rounded-md border text-gray-800 text-sm">
            <Typography
              variant="small"
              className="font-medium text-gray-700 mb-1"
            >
              Description
            </Typography>
            <Typography variant="paragraph">
              {selectedApplication.description}
            </Typography>
          </div>
        )}

        <div>
          <Checkbox
            label={
              <Typography variant="small" className="text-gray-700">
                I agree to the{" "}
                <span className="text-blue-500 underline">
                  terms and conditions
                </span>
                .
              </Typography>
            }
            checked={agreedToTerms}
            onChange={() => setAgreedToTerms(!agreedToTerms)}
          />
        </div>
      </DialogBody>

      <DialogFooter className="flex justify-between gap-3">
        <Button
          variant="outlined"
          color="gray"
          onClick={onClose}
          className="rounded-md"
        >
          Cancel
        </Button>
        <Button
          color="blue"
          onClick={handleSubmit}
          disabled={!selectedApplicationId || !agreedToTerms || isSubmitting}
          className="rounded-md"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

ApplicationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  requestId: PropTypes.string,
};

export default ApplicationModal;
