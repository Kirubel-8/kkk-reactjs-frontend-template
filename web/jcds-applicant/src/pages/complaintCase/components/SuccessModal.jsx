import React from "react";
import { Button, Typography } from "@material-tailwind/react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

const SuccessModal = ({ isOpen, onClose, onFinish }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <Typography variant="h4" className="text-gray-900 mb-4">
          Report Successfully Submitted
        </Typography>

        {/* Description */}
        <Typography variant="small" className="text-gray-600 mb-6">
          Thank you for your report. Your information has been successfully received and recorded in our system.
        </Typography>

        {/* Action Button */}
        <Button
          onClick={onFinish}
          className="bg-teal-600 hover:bg-teal-700"
          fullWidth
        >
          Finish
        </Button>
      </div>
    </div>
  );
};

SuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
};

export default SuccessModal;
