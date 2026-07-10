import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Input, Textarea, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";

const JudgeInfoStep = forwardRef(({ data = {}, onChange, onValidationChange }, ref) => {
  const [formData, setFormData] = useState({
    judgeFullName: data.judgeFullName || "",
    servingPlace: data.servingPlace || "",
    caseFileNumber: data.caseFileNumber || "",
    description: data.description || "",
    ...data
  });

  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'judgeFullName':
        if (!value.trim()) {
          newErrors.judgeFullName = 'Judge or Council Full Name is required';
        } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(value.trim())) {
          newErrors.judgeFullName = 'Name should contain only letters, spaces and forward slashes';
        } else if (value.trim().length < 2) {
          newErrors.judgeFullName = 'Name should be at least 2 characters';
        } else {
          delete newErrors.judgeFullName;
        }
        break;
        
      case 'servingPlace':
        if (!value) {
          newErrors.servingPlace = 'court office must be selected';
        } else {
          delete newErrors.servingPlace;
        }
        break;
        
      case 'caseFileNumber':
        // Case file number is optional, but if provided, must be at least 3 characters
        if (value.trim() && value.trim().length < 3) {
          newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
        } else {
          delete newErrors.caseFileNumber;
        }
        break;
        
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description should be at least 10 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllFields = () => {
    const newErrors = {};
    
    // Validate judgeFullName
    if (!formData.judgeFullName.trim()) {
      newErrors.judgeFullName = 'Judge or Council Full Name is required';
    } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(formData.judgeFullName.trim())) {
      newErrors.judgeFullName = 'Name should contain only letters, spaces, Amharic characters, and forward slashes';
    } else if (formData.judgeFullName.trim().length < 2) {
      newErrors.judgeFullName = 'Name should be at least 2 characters';
    }
    
    // Validate servingPlace
    if (!formData.servingPlace) {
      newErrors.servingPlace = 'court office must be selected';
    }
    
    // Validate caseFileNumber (optional, but if provided, must be at least 3 characters)
    if (formData.caseFileNumber.trim() && formData.caseFileNumber.trim().length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    
    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters';
    }
    
    setErrors(newErrors);
    setHasAttemptedSubmit(true);
    
    const isValid = Object.keys(newErrors).length === 0;
    
    // Notify parent about validation status
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    
    return isValid;
  };

  // Check if form is valid for enabling/disabling Next button
  const isFormValid = () => {
    return Object.keys(errors).length === 0 && 
           formData.judgeFullName.trim() && 
           formData.servingPlace && 
           formData.description.trim();
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Validate the field
    validateField(field, value);
    
    onChange(newData);
  };

  const getInputClassName = (field) => {
    return errors[field] ? 'border-red-500 focus:border-red-500' : '';
  };

  // Expose validation function to parent component
  useImperativeHandle(ref, () => ({
    validateAllFields: () => {
      return validateAllFields();
    }
  }));

  return (
    <div className="space-y-3">
      {/* <Typography variant="h5" className="text-gray-900 mb-6">
        Judge Info
      </Typography> */}

      <div className="space-y-3 mt-2">
        {/* Three Column Layout for Judge Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Judge or Council Name <span className="text-red-500">*</span>
            </Typography>
            <Input
              placeholder="Enter Name of the Judge"
              value={formData.judgeFullName}
              onChange={(e) => handleChange('judgeFullName', e.target.value)}
              className={getInputClassName('judgeFullName')}
              // required
            />
            {errors.judgeFullName && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.judgeFullName}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Court Office <span className="text-red-500">*</span>
            </Typography>
            <Input
              placeholder="     Enter court office Where the judge assign works"
              value={formData.servingPlace}
              onChange={(e) => handleChange('servingPlace', e.target.value)}
              className={getInputClassName('servingPlace')}
              // required
            />
            {errors.servingPlace && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.servingPlace}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Case File Number
            </Typography>
            <Input
              placeholder=" Enter file number"
              value={formData.caseFileNumber}
              onChange={(e) => handleChange('caseFileNumber', e.target.value)}
              className={getInputClassName('caseFileNumber')}
              // required
            />
            {errors.caseFileNumber && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.caseFileNumber}
              </Typography>
            )}
          </div>

        </div>

        {/* Description Field - Full Width */}
        <div>
          <Typography variant="small" className="text-primary mb-1 font-semibold">
            {/* Description * */}
            Disciplinary Issue <span className="text-red-500">*</span>
          </Typography>
          <Textarea
            placeholder=" Describe about the disciplinary issue"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={getInputClassName('description')}
            required
            rows={3}
          />
          {errors.description && (
            <Typography variant="small" className="text-red-500 mt-1">
              {errors.description}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
});

JudgeInfoStep.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onValidationChange: PropTypes.func,
};

export default JudgeInfoStep;
