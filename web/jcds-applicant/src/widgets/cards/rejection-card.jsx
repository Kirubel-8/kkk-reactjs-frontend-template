import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { Typography } from "@material-tailwind/react";

const RejectionCard = ({
  date,
  rejectionReason,
  rejectionReasonDescription,
  feedback,
}) => {
  return (
    <div className="border-l-4 border-[#4475F2] p-4 bg-white shadow-md rounded-lg mt-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <DocumentTextIcon className="h-6 w-6 text-gray-600" />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center">
            <Typography variant="small" className="text-xs font-semibold">
              File Feedback
            </Typography>
            <Typography variant="small" color="blue-gray" className="text-xs">
              {date}
            </Typography>
          </div>

          {rejectionReason ? (
            <div className="flex items-center space-x-1 text-red-500 mt-1">
              <Typography variant="small" className="font-medium text-xs">
                Rejected
              </Typography>
              <XCircleIcon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        {rejectionReason ? (
          <>
            <Typography variant="small" color="blue-gray" className="text-xs">
              Reason: {rejectionReason}
            </Typography>
            <Typography variant="small" color="blue-gray" className="text-xs">
              Description: {rejectionReasonDescription}
            </Typography>
          </>
        ) : (
          <Typography variant="small" color="gray" className="text-xs italic">
            No comments for this file.
          </Typography>
        )}
      </div>
    </div>
  );
};

export default RejectionCard;
