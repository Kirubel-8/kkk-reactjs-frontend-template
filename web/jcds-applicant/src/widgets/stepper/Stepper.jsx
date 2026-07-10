import React from "react";
import PropTypes from "prop-types";
import { Typography } from "@material-tailwind/react";
import { CheckIcon } from "@heroicons/react/24/solid";

const Stepper = ({
  steps = [],
  currentStep = 0,
  orientation = "horizontal",
  size = "md",
  color = "blue",
  showLabels = true,
  showConnectors = true,
  className = "",
  onStepClick,
  completedIcon,
  showNumbers = false,
  responsive = true,
}) => {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "current";
    return "upcoming";
  };

  const getStepIcon = (step, status, stepIndex) => {
    if (status === "completed") {
      return completedIcon || <CheckIcon className="w-4 h-4" />;
    }
    if (status === "current") {
      if (showNumbers) {
        return (
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[14px] font-semibold">
            {stepIndex + 1}
          </div>
        );
      }
      return <div className="w-4 h-4 rounded-full bg-primary border-2 border-white" />;
    }
    if (showNumbers) {
      return (
        <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-[14px] font-semibold">
          {stepIndex + 1}
        </div>
      );
    }
    return <div className="w-4 h-4 rounded-full bg-gray-300 border-2 border-white" />;
  };

  const getStepClasses = (status, size) => {
    const baseClasses = "flex flex-col items-center justify-start rounded-lg transition-all duration-200 px-2 sm:px-3 w-full ";
    
    const sizeClasses = {
      sm: "text-xs min-h-16 sm:min-h-20",
      md: "text-sm min-h-20 sm:min-h-24",
      lg: "text-base min-h-24 sm:min-h-28"
    };

    const statusClasses = {
      completed: "bg-primary text-white",
      current: "bg-primary text-white",
      upcoming: "bg-gray-200 text-gray-600 border border-gray-300"
    };

    return `${baseClasses} ${sizeClasses[size]} ${statusClasses[status]}`;
  };

  const getConnectorClasses = (status, orientation) => {
    const baseClasses = "transition-all duration-200 flex items-center justify-center";
    
    if (orientation === "horizontal") {
      return `${baseClasses} text-primary font-bold text-lg sm:text-xl ${
        status === "completed" ? "text-primary" : "text-gray-400"
      }`;
    } else {
      return `${baseClasses} text-primary font-bold text-lg sm:text-xl ${
        status === "completed" ? "text-primary" : "text-gray-400"
      }`;
    }
  };

  const getLabelClasses = (status, size) => {
    const baseClasses = "transition-all duration-200";
    
    const sizeClasses = {
      sm: "text-[14px]",
      md: "text-[14px]",
      lg: "text-[14px]"
    };

    const statusClasses = {
      completed: "text-primary font-semibold",
      current: "text-primary font-semibold",
      upcoming: "text-gray-600 font-normal"
    };

    return `${baseClasses} ${sizeClasses[size]} ${statusClasses[status]}`;
  };

  const handleStepClick = (stepIndex, step) => {
    if (onStepClick && stepIndex <= currentStep) {
      onStepClick(stepIndex, step);
    }
  };

  if (orientation === "vertical") {
    return (
      <div className={`flex flex-col space-y-4 ${className}`}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={index} className="flex items-start">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(index, step)}
                  disabled={!onStepClick || index > currentStep}
                  className={`${getStepClasses(status, size)} ${
                    onStepClick && index <= currentStep ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  {getStepIcon(step, status, index)}
                </button>
                
                {!isLast && showConnectors && (
                  <div className={getConnectorClasses(status, orientation)} />
                )}
              </div>
              
              <div className="ml-4 flex-1">
                {showLabels && (
                  <div className="space-y-1">
                    <Typography
                      variant="small"
                      className={getLabelClasses(status, size)}
                    >
                      {step.title}
                    </Typography>
                    {step.description && (
                      <Typography
                        variant="small"
                        className="text-gray-500 text-[14px]"
                      >
                        {step.description}
                      </Typography>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Check if stepper should use compact mode (when screen is smaller than md)
  const shouldUseCompactMode = () => {
    if (!responsive) return false;
    
    // Use compact mode for screens smaller than md (768px)
    // This will be handled by CSS classes, but we need to detect it
    return true; // Always show both versions, CSS will handle visibility
  };

  // Compact stepper for screens smaller than md (mobile)
  const renderCompactStepper = () => {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isLast = index === steps.length - 1;
            const nextStatus = !isLast ? getStepStatus(index + 1) : null;
            const isConnectionCompleted = !isLast && (nextStatus === "completed" || nextStatus === "current" || status === "completed");
            
            return (
              <React.Fragment key={index}>
                <button
                  onClick={() => handleStepClick(index, step)}
                  disabled={!onStepClick || index > currentStep}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 relative z-10 ${
                    onStepClick && index <= currentStep ? "cursor-pointer" : "cursor-default"
                  } ${
                    status === "completed" 
                      ? "bg-primary text-white" 
                      : status === "current"
                      ? "bg-primary text-white"
                      : "bg-gray-300 text-gray-600 border-2 border-gray-400"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="text-[14px] font-semibold">{index + 1}</span>
                  )}
                </button>
                
                {!isLast && (
                  <div className="flex items-center">
                    <div className={`w-3 sm:w-4 h-0.5 ${
                      isConnectionCompleted ? "bg-primary" : "bg-gray-300"
                    }`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isConnectionCompleted ? "bg-primary" : "bg-gray-300"
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Compressed stepper for tablets (md to lg)
  const renderCompressedStepper = () => {
    return (
      <div className="flex items-center justify-center overflow-x-auto">
        <div className="flex items-center min-w-max">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isLast = index === steps.length - 1;
            const nextStatus = !isLast ? getStepStatus(index + 1) : null;
            const isConnectionCompleted = !isLast && (nextStatus === "completed" || nextStatus === "current" || status === "completed");
            
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                  <button
                    onClick={() => handleStepClick(index, step)}
                    disabled={!onStepClick || index > currentStep}
                    className={`${getStepClasses(status, "sm")} ${
                      onStepClick && index <= currentStep ? "cursor-pointer" : "cursor-default"
                    } flex flex-col items-center gap-1 py-1 px-2`}
                  >
                    <div className="flex items-center gap-1 w-full">
                      {getStepIcon(step, status, index)}
                      {showLabels && (
                        <span className="font-medium text-[14px] whitespace-nowrap overflow-hidden text-ellipsis max-w-16">
                          {step.title}
                        </span>
                      )}
                    </div>
                    {showLabels && step.description && (
                      <span className="text-[14px] opacity-90 text-center w-full whitespace-nowrap overflow-hidden text-ellipsis max-w-20">
                        {step.description}
                      </span>
                    )}
                  </button>
                </div>
                
                {!isLast && showConnectors && (
                  <div className="flex items-center">
                    <div className={`h-0.5 w-3 ${
                      isConnectionCompleted ? "bg-primary" : "bg-gray-300"
                    }`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isConnectionCompleted ? "bg-primary" : "bg-gray-300"
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Regular stepper for md and larger screens
  const renderRegularStepper = () => {
    return (
      <div className="flex items-center justify-center overflow-x-auto">
        <div className="flex items-center min-w-max">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isLast = index === steps.length - 1;
            const nextStatus = !isLast ? getStepStatus(index + 1) : null;
            const isConnectionCompleted = !isLast && (nextStatus === "completed" || nextStatus === "current" || status === "completed");
            
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                  <button
                    onClick={() => handleStepClick(index, step)}
                    disabled={!onStepClick || index > currentStep}
                    className={`${getStepClasses(status, size)} ${
                      onStepClick && index <= currentStep ? "cursor-pointer" : "cursor-default"
                    } flex flex-col items-center gap-1 py-2 sm:py-3`}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 w-full">
                      {getStepIcon(step, status, index)}
                      {showLabels && (
                        <span className="font-medium text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                          {step.title}
                        </span>
                      )}
                    </div>
                    {showLabels && step.description && (
                      <span className="text-[14px] opacity-90 text-start w-full whitespace-nowrap overflow-hidden text-ellipsis">
                        {step.description}
                      </span>
                    )}
                  </button>
                </div>
                
                {!isLast && showConnectors && (
                  <div className="flex items-center">
                    <div className={`h-0.5 w-4 sm:w-6 ${
                      isConnectionCompleted ? "bg-primary" : "bg-gray-300"
                    }`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isConnectionCompleted ? "bg-primary" : "bg-gray-300"
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Compact stepper - visible on screens smaller than md (mobile) */}
      <div className="block md:hidden">
        {renderCompactStepper()}
      </div>
      
      {/* Compressed stepper - visible on md to lg screens (tablets) */}
      <div className="hidden md:block lg:hidden">
        {renderCompressedStepper()}
      </div>
      
      {/* Regular stepper - visible on lg and larger screens (desktop) */}
      <div className="hidden lg:block">
        {renderRegularStepper()}
      </div>
    </div>
  );
};

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.node,
    })
  ).isRequired,
  currentStep: PropTypes.number,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  color: PropTypes.oneOf(["blue", "green", "red", "yellow", "purple"]),
  showLabels: PropTypes.bool,
  showConnectors: PropTypes.bool,
  className: PropTypes.string,
  onStepClick: PropTypes.func,
  completedIcon: PropTypes.node,
  showNumbers: PropTypes.bool,
  responsive: PropTypes.bool,
};

Stepper.defaultProps = {
  currentStep: 0,
  orientation: "horizontal",
  size: "md",
  color: "blue",
  showLabels: true,
  showConnectors: true,
  className: "",
  onStepClick: null,
  completedIcon: null,
  showNumbers: false,
  responsive: true,
};

export default Stepper;
