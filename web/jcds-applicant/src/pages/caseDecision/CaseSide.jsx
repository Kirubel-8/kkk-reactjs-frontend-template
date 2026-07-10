import React from "react";

// import InternalRequestHandler from '../../../../cci/src/pages/component-overview/InternalRequest/InternalRequestHandler';
import {
  StatisticsCardApplicant,
  StatisticsCardRepresentative,
} from "@/widgets/cards";
import StatisticsCardRespondent from "@/widgets/cards/statistics-card-respondent";
import { UserIcon } from "@heroicons/react/24/solid";

export const CaseSide = ({requestsData}) => {
console.log("side",Object.keys(requestsData).length)
   const handleDelete = async (requestId) => {
    };
    const {
      icon,
      applicantNames,
      applicantRegions,
      applicantZones,
      applicantWoredas,
      applicantCity,
      applicantSubCity,
      respondentRegions,
      respondentZones,
      respondentWoredas,
      respondentCities,
      respondentSubCities,
      status,
      representative_name,
      phone,
      phone_additional,
      gender,
      respondentNames,
      request_date,
      request_id,
      requestDocuments,
      documentStatusCount,
      violated_constitution_article,
      affair_description,
      constitutional_complaint_summary,
    } = requestsData;
  return (
    <div>
      <div className="mt-2">
        {requestsData && Object.keys(requestsData).length > 0 ? (
              <div
                key={request_id}
                className="flex flex-col p-4 items-center justify-center w-96 shadow-xl rounded-md gap-6"
              >
                <h1>Case</h1>

                <div className="flex flex-col gap-4">
                  <div className="border shadow-sm rounded-md">
                    <StatisticsCardApplicant
                      icon={React.createElement(icon, {
                        className: "w-6 h-6 text-blue-500",
                      })}
                      applicantName={applicantNames}
                      applicantRegions={applicantRegions}
                      applicantZones={applicantZones}
                      applicantWoredas={applicantWoredas}
                      applicantCity={applicantCity}
                      applicantSubCity={applicantSubCity}
                      status={status}
                      representative={representative_name}
                      respondentName={respondentNames}
                      requestDate={request_date}
                      request_id={request_id}
                      onDelete={handleDelete}
                      className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                    />
                  </div>
                  <div className="border shadow-md rounded-md">
                    <StatisticsCardRepresentative
                      icon={React.createElement(icon, {
                        className: "w-6 h-6 text-blue-500",
                      })}
                      documents={requestDocuments}
                      applicantName={applicantNames}
                      status={status}
                      representative={representative_name}
                      phone={phone}
                      phone_additional={phone_additional}
                      gender={gender}
                      respondentName={respondentNames}
                      requestDate={request_date}
                      request_id={request_id}
                      onDelete={handleDelete}
                      className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                    />
                  </div>
                  <div className="border shadow-md rounded-md">
                    <StatisticsCardRespondent
                      icon={React.createElement(icon, {
                        className: "w-6 h-6 text-blue-500",
                      })}
                      respondentName={respondentNames}
                      respondentRegions={respondentRegions}
                      respondentZones={respondentZones}
                      respondentWoredas={respondentWoredas}
                      respondentCity={respondentCities}
                      respondentSubCity={respondentSubCities}
                      status={status}
                      representative={representative_name}
                      requestDate={request_date}
                      request_id={request_id}
                      onDelete={handleDelete}
                      className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                    />
                  </div>
                </div>
              </div>
  
          
        ) : (
          <div className="flex flex-col gap-4 ">
            <div className="w-full max-w-sm bg-white shadow-sm rounded-lg p-6 flex flex-col items-center border border-gray-200 gap-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <h1 className="text-sm font-bold text-gray-800">
                  Application Detail
                </h1>
                <div className="w-11 h-11 flex items-center justify-center bg-[#416FE429] text-[#a8bef0] border border-[#a8bef0] rounded-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="w-full max-w-sm bg-white shadow-sm rounded-lg p-6 flex flex-col items-center border border-gray-200 gap-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <h1 className="text-sm font-bold text-gray-800">
                  Representative Detail
                </h1>
                <div className="w-11 h-11 flex items-center justify-center bg-[#416FE429] text-[#a8bef0] border border-[#a8bef0] rounded-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="w-full max-w-sm bg-white shadow-sm rounded-lg p-6 flex flex-col items-center border border-gray-200 gap-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <h1 className="text-sm font-bold text-gray-800">
                  Respondent Detail
                </h1>
                <div className="w-11 h-11 flex items-center justify-center bg-[#416FE429] text-[#a8bef0] border border-[#a8bef0] rounded-lg">
                  <UserIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseSide;
