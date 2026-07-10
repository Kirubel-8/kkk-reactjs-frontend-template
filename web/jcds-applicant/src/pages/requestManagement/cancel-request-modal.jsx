import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
} from "@material-tailwind/react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/solid";

const CancelRequestModal = ({ isOpen, onClose, onConfirm, requestType = "request" }) => {
  // Map requestType to the appropriate reporting text
  const getReportingText = () => {
    const lowerType = requestType.toLowerCase();
    if (lowerType.includes("disciplinary")) {
      return "disciplinary reporting";
    } else if (lowerType.includes("complaint")) {
      return "complaint reporting";
    }
    return "reporting";
  };

  const reportingText = getReportingText();

  return (
    <Dialog
      open={isOpen}
      handler={onClose}
      size="sm"
      className="bg-white"
    >
      <DialogHeader className="flex items-center gap-[clamp(10px,1vw,16px)] pb-[clamp(8px,1vh,12px)]">
        <div className="w-[clamp(36px,4vw,44px)] h-[clamp(36px,4vw,44px)] bg-red-100 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-[clamp(20px,3vw,24px)] h-[clamp(20px,3vw,24px)] text-primary" />
        </div>
        <Typography
          variant="h5"
          color="primary"
          className="font-semibold"
          style={{ fontFamily: "Montserrat", fontSize: "clamp(18px,1.2vw,22px)" }}
        >
          Cancel Reporting
        </Typography>
      </DialogHeader>

      <DialogBody className="pt-0 space-y-[clamp(6px,0.8vh,10px)]">
        <Typography
          variant="paragraph"
          color="gray"
          className="text-base"
          style={{ fontFamily: "Montserrat", fontSize: "clamp(14px,1vw,16px)", lineHeight: 1.5 }}
        >
          Are you sure you want to cancel this {reportingText}? 
          Any unsaved changes will be lost and cannot be recovered.
        </Typography>
        <Typography
          variant="small"
          color="gray"
          className="mt-2 text-sm"
          style={{ fontFamily: "Montserrat", fontSize: "clamp(12px,0.9vw,14px)" }}
        >
          This action cannot be undone.
        </Typography>
      </DialogBody>

      <DialogFooter className="flex gap-[clamp(10px,1.2vw,14px)] pt-[clamp(12px,1.6vh,16px)]">
        <Button
          variant="outlined"
          color="gray"
          onClick={onClose}
          className="flex items-center gap-[clamp(6px,0.8vw,10px)] px-[clamp(16px,3vw,22px)] py-[clamp(10px,1.4vh,12px)]"
          style={{ fontFamily: "Montserrat" }}
        >
          <span>Keep Reporting</span>
        </Button>
        <Button
          variant="filled"
          onClick={onConfirm}
          className="flex items-center gap-[clamp(6px,0.8vw,10px)] px-[clamp(16px,3vw,22px)] py-[clamp(10px,1.4vh,12px)] transition-colors duration-200 hover:!bg-[#E89494]"
          style={{ 
            fontFamily: "Montserrat",
            backgroundColor: "#F1A4A4",
            color: "#FFFFFF"
          }}
        >
          {/* <XMarkIcon className="w-4 h-4" /> */}
          <span>Yes</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default CancelRequestModal;
