import PropTypes from "prop-types";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export function DisciplinaryCard3({
  request_id,
  case_type,
  judge_name,
  file_number,
  status,
  request_date,
}) {
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMMM dd, yyyy");
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      under_investigation: "Under Investigation",
      under_council_review: "Under Council Review",
      accepted: "Accepted",
      Decided: "Decided",
      rejected: "Rejected",
      returned: "Returned",
    };
    return statusMap[status] || status || "N/A";
  };

  const getStatusColor = (status) => {
    if (!status) return "#3BA1F5";
    const normalizedStatus = status.toLowerCase();
    const colorMap = {
      pending: "#F7B84B",
      pending_director_approval: "#F7B84B",
      under_investigation: "#FFD666",
      under_council_review: "#4C8BFF",
      accepted: "#49C178",
      returned: "#B792E8",
      rejected: "#E85A5A",
      decided: "#2E5B6D"
    };
    return colorMap[normalizedStatus] || "#3BA1F5"; // Default color if status not found
  };

  const shortId = request_id ? request_id.toString().slice(0, 8).toUpperCase() : "N/A";

  const handleViewClick = () => {
    if (request_id) {
      const id = request_id.toString();
      const shortId = id.substring(0, 8);
      navigate(`/home/new-disciplinary-details/${shortId}`, {
        state: { fullRequestId: id }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl flex flex-col gap-3 w-full max-w-3xl min-h-72 py-4 px-6 shadow-md">
      {/* First Section: Disciplinary ID and Case Type */}
      <div className="flex flex-col gap-1.5 rounded-md w-full py-2 px-4 min-h-20 border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-black">
          <span>Report ID</span>
          <span className="text-right font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none rounded px-1 py-0.5 min-w-28 h-6 flex items-center justify-center bg-[#215167] text-white">
            {shortId}
          </span>
        </div>

        {/* Divider between ID and Case Type */}
        {/* <div className="w-full border-t border-gray-200" /> */}

        {/* <div className="flex items-center justify-between font-['Montserrat'] font-semibold text-lg leading-none text-[#073954]">
          <span>Case Type</span>
          <span className="text-right">Disciplinary Case</span>
        </div> */}
      </div>

      {/* Second Section: Judge Name, File Number, Current Status, Applied Date */}
      <div className="flex flex-col gap-3 w-full min-h-44">
        {/* Judge Name */}
        <div className="flex items-center justify-between font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
          <span>Judge Name</span>
          <span className="text-right font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
            {judge_name || "N/A"}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-200" />

        {/* File Number */}
        <div className="flex items-center justify-between font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
          <span>File Number</span>
          <span className="text-right font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
            {file_number || "N/A"}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-200" />

        {/* Current Status */}
        <div className="flex items-center justify-between font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
          <span>Current Status</span>
          <span 
            className="text-right font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none"
            style={{ color: getStatusColor(status) }}
          >
            {getStatusText(status)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-200" />

        {/* Applied Date */}
        <div className="flex items-center justify-between font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
          <span>Applied Date</span>
          <span className="text-right font-['Montserrat'] font-normal text-[clamp(16px,0.94vw,18px)] leading-none text-[#212121]">
            {formatDate(request_date)}
          </span>
        </div>
      </div>

      {/* View Button */}
      <div className="flex justify-end w-full mt-auto">
        <button
          onClick={handleViewClick}
          className="flex items-center justify-center bg-[#215167] text-white rounded-[10px] font-['Montserrat'] font-semibold text-[clamp(16px,0.99vw,19px)] leading-[100%] tracking-normal hover:bg-[#1a4050] transition-colors cursor-pointer"
          style={{
            width: '150px',
            height: 'clamp(40px,2.71vh,49px)',
            paddingTop: '13px',
            paddingRight: '18px',
            paddingBottom: '13px',
            paddingLeft: '18px',
            gap: '10px',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: 'clamp(16px,0.99vw,19px)',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: '#FFFFFF',
          }}
        >
          View Detail
        </button>
      </div>
    </div>
  );
}

DisciplinaryCard3.propTypes = {
  request_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  case_type: PropTypes.string,
  judge_name: PropTypes.string,
  file_number: PropTypes.string,
  status: PropTypes.string,
  request_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

DisciplinaryCard3.defaultProps = {
  request_id: "",
  case_type: "",
  judge_name: "",
  file_number: "",
  status: "",
  request_date: null,
};

export default DisciplinaryCard3;

