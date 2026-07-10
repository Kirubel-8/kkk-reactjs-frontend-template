import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, IconButton } from "@material-tailwind/react";
import requirementsIcon from "@/assets/images/pajamas_requirements.png";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleDisciplinaryClick = () => {
    navigate("/home/new-disciplinary-request");
  };

  const handleComplaintClick = () => {
    navigate("/home/new-complaint-request");
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[clamp(320px,75vw,1440px)] h-auto min-h-[clamp(400px,55.56vh,600px)] mx-auto px-[clamp(16px,2.08vw,32px)] py-[clamp(16px,2.22vh,32px)] mt-[clamp(16px,4.17vw,80px)] overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full">
        {/* Slogan */}
        <div className="mb-[clamp(24px,2.78vh,48px)] text-center text-balance w-full px-[clamp(8px,0.83vw,16px)]">
          <Typography className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-bold text-[clamp(24px,3.13vw,96px)] leading-tight tracking-normal text-center text-landing-color">
            Your Voice Matters. Report Judicial Issues
          </Typography>
          <Typography className="mb-[clamp(16px,0.83vw,16px)] mt-[clamp(12px,1.39vh,24px)] font-['Montserrat'] font-bold text-[clamp(24px,3.13vw,96px)] leading-tight tracking-normal text-center text-landing-color">
            Safely and Confidentially.
          </Typography>
          <Typography 
            className="font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-[clamp(20px,1.39vh,24px)] tracking-normal text-center normal-case px-[clamp(8px,0.42vw,8px)] text-[#073954B2]"
          >
            A secure platform to submit complaints, track progress, and support justice reform.
          </Typography>
        </div>

        {/* What complaint you have? Heading */}
        <div className="mt-[clamp(32px,4.17vw,80px)] mb-[clamp(32px,3.7vh,64px)] text-center px-[clamp(8px,0.42vw,8px)]">
          <Typography 
            className="font-['Montserrat'] font-bold text-center text-[clamp(20px,2.08vw,36px)] leading-[1.2] [letter-spacing:0%] text-[#073954]"
          >
            What complaint do you have?
          </Typography>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row flex-wrap justify-center gap-[clamp(12px,0.83vw,16px)] w-full max-w-[clamp(320px,80vw,1536px)] px-[clamp(8px,0.83vw,16px)] mx-auto">
          {/* Left Button - Disciplinary */}
          <Button
            onClick={handleDisciplinaryClick}
            className="transition-all duration-200 shadow-md hover:shadow-lg flex flex-row items-center justify-between w-full max-w-[clamp(280px,28.65vw,550px)] h-auto min-h-[clamp(100px,11.57vh,125px)] rounded-lg bg-white py-[clamp(12px,1.39vh,20px)] px-[clamp(12px,1.25vw,24px)] text-landing-color border border-[#CFCFCF]"
          >
            <div className="flex flex-col items-start flex-1 min-w-0">
              <div className="flex items-center mb-[clamp(6px,0.52vw,8px)] gap-[clamp(8px,0.42vw,8px)]">
                <img
                  src={requirementsIcon}
                  alt="Requirements"
                  className="w-[clamp(20px,1.46vw,28px)] h-[clamp(20px,1.46vw,28px)] mt-[clamp(2px,0.14vh,2px)] ml-[clamp(2px,0.14vh,2px)] shrink-0"
                />
                <Typography className="font-['Montserrat'] font-semibold text-[clamp(14px,0.83vw,16px)] leading-tight tracking-normal text-landing-color w-auto normal-case m-0 p-0 text-left">
                  Disciplinary Reporting
                </Typography>
              </div>
              <Typography 
                className="font-['Montserrat'] font-medium tracking-normal w-full max-w-md h-auto min-h-[clamp(40px,4.17vh,45px)] normal-case ml-[clamp(0px,1.25vw,24px)] text-left text-[clamp(12px,0.73vw,14px)] leading-[1.3] [letter-spacing:0%] text-[#7D7D7D]"
              >
                This system accepts reports related to judicial misconduct, administrative issues, rights violations, and other justice-sector problems.
              </Typography>
            </div>
            <IconButton
              variant="text"
              color="blue-gray"
              className="w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] shrink-0 ml-[clamp(8px,0.83vw,16px)]"
            >
              <ArrowRightIcon className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] text-[#215167]"/>
            </IconButton>
          </Button>

          {/* Right Button - Complaint */}
          <Button
            onClick={handleComplaintClick}
            className="transition-all duration-200 shadow-md hover:shadow-lg flex flex-row items-center justify-between w-full max-w-[clamp(280px,28.65vw,550px)] h-auto min-h-[clamp(100px,11.57vh,125px)] rounded-lg bg-white py-[clamp(12px,1.39vh,20px)] px-[clamp(12px,1.25vw,24px)] text-landing-color border border-[#CFCFCF]"
          >
            <div className="flex flex-col items-start flex-1 min-w-0">
              <div className="flex items-center mb-[clamp(6px,0.52vw,8px)] gap-[clamp(8px,0.42vw,8px)]">
                <img
                  src={requirementsIcon}
                  alt="Requirements"
                  className="w-[clamp(20px,1.46vw,28px)] h-[clamp(20px,1.46vw,28px)] mt-[clamp(2px,0.14vh,2px)] ml-[clamp(2px,0.14vh,2px)] shrink-0"
                />
                <Typography className="font-['Montserrat'] font-semibold text-[clamp(14px,0.83vw,16px)] leading-tight tracking-normal text-landing-color w-auto normal-case m-0 p-0 text-left">
                  Complaint Reporting
                </Typography>
              </div>
              <Typography 
                className="font-['Montserrat'] font-medium tracking-normal w-full max-w-md h-auto min-h-[clamp(40px,4.17vh,45px)] normal-case ml-[clamp(0px,1.25vw,24px)] text-left text-[clamp(12px,0.73vw,14px)] leading-[1.3] [letter-spacing:0%] text-[#7D7D7D]"
              >
                This system accepts reports related to judicial misconduct, administrative issues, rights violations, and other justice-sector problems.
              </Typography>
            </div>
            <IconButton
              variant="text"
              color="blue-gray"
              className="w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] shrink-0 ml-[clamp(8px,0.83vw,16px)]"
            >
              <ArrowRightIcon className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] text-[#215167]"/>
            </IconButton>
          </Button>
        </div>
      </div>
    </div>
  );
}
