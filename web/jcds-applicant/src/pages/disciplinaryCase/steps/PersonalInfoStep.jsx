import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Input, Select, Option, Textarea, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";

const PersonalInfoStep = forwardRef(({ data = {}, onChange, onValidationChange }, ref) => {
  const [formData, setFormData] = useState({
    fullName: data.fullName || "",
    phoneNumber: data.phoneNumber || "",
    caseType: data.caseType || "",
    region: data.region || "",
    zone: data.zone || "",
    woreda: data.woreda || "",
    ...data
  });

  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'Full name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.fullName = 'Full name should contain only letters and spaces';
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'Full name should be at least 2 characters';
        } else {
          delete newErrors.fullName;
        }
        break;
        
      case 'phoneNumber':
        if (!value.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value.replace(/\s/g, ''))) {
          newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
        } else {
          delete newErrors.phoneNumber;
        }
        break;
        
      case 'caseType':
        if (!value) {
          newErrors.caseType = 'Case type is required';
        } else {
          delete newErrors.caseType;
        }
        break;
        
      case 'region':
        if (!value) {
          newErrors.region = 'Region is required';
        } else {
          delete newErrors.region;
        }
        break;
        
      case 'zone':
        if (!value) {
          newErrors.zone = 'Zone/Sub City is required';
        } else {
          delete newErrors.zone;
        }
        break;
        
      case 'woreda':
        if (!value) {
          newErrors.woreda = 'Woreda is required';
        } else {
          delete newErrors.woreda;
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
    
    // Validate fullName
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name should contain only letters and spaces';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name should be at least 2 characters';
    }
    
    // Validate phoneNumber
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    
    // Validate caseType
    if (!formData.caseType) {
      newErrors.caseType = 'Case type is required';
    }
    
    // Validate region
    if (!formData.region) {
      newErrors.region = 'Region is required';
    }
    
    // Validate zone
    if (!formData.zone) {
      newErrors.zone = 'Zone/Sub City is required';
    }
    
    // Validate woreda
    if (!formData.woreda) {
      newErrors.woreda = 'Woreda is required';
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
           formData.fullName.trim() && 
           formData.phoneNumber.trim() && 
           formData.caseType && 
           formData.region && 
           formData.zone && 
           formData.woreda;
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
      <Typography variant="h6" className="text-gray-900 mb-2">
        Personal Info
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-3">
          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Complaint Full Name *
            </Typography>
            <Input
              placeholder="     Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={getInputClassName('fullName')}
              required
            />
            {errors.fullName && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.fullName}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Case Type *
            </Typography>
            <Select
              value={formData.caseType}
              onChange={(value) => handleChange('caseType', value)}
              className={getInputClassName('caseType')}
            >
              <Option value="disciplinary">Disciplinary Case</Option>
              <Option value="corruption">Corruption Case</Option>
              <Option value="misconduct">Misconduct Case</Option>
              <Option value="other">Other</Option>
            </Select>
            {errors.caseType && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.caseType}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Zone/ Sub City *
            </Typography>
            <Select
              value={formData.zone}
              onChange={(value) => handleChange('zone', value)}
              className={getInputClassName('zone')}
            >
              <Option value="zone1">Zone 1</Option>
              <Option value="zone2">Zone 2</Option>
              <Option value="zone3">Zone 3</Option>
            </Select>
            {errors.zone && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.zone}
              </Typography>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Phone Number *
            </Typography>
            <Input
              placeholder="     Enter your phone number"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              className={getInputClassName('phoneNumber')}
              required
            />
            {errors.phoneNumber && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.phoneNumber}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Region / City Administration *
            </Typography>
            <Select
              value={formData.region}
              onChange={(value) => handleChange('region', value)}
              className={getInputClassName('region')}
            >
              <Option value="addis-ababa">Addis Ababa</Option>
              <Option value="oromia">Oromia</Option>
              <Option value="amhara">Amhara</Option>
              <Option value="tigray">Tigray</Option>
            </Select>
            {errors.region && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.region}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Woreda *
            </Typography>
            <Select
              value={formData.woreda}
              onChange={(value) => handleChange('woreda', value)}
              className={getInputClassName('woreda')}
            >
              <Option value="woreda1">Woreda 1</Option>
              <Option value="woreda2">Woreda 2</Option>
              <Option value="woreda3">Woreda 3</Option>
            </Select>
            {errors.woreda && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.woreda}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PersonalInfoStep.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onValidationChange: PropTypes.func,
};

export default PersonalInfoStep;
