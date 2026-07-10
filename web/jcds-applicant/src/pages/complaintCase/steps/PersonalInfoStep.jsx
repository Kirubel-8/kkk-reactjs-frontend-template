import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Input, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";

const PersonalInfoStep = forwardRef(({ data = {}, onChange, onValidationChange }, ref) => {
  const [formData, setFormData] = useState({
    fullName: data.fullName || "",
    phoneNumber: data.phoneNumber || "",
    gender: data.gender || "",
    ...data
  });

  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Update formData when data prop changes (e.g., when navigating back)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData(prev => ({
        fullName: data.fullName !== undefined ? data.fullName : prev.fullName,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : prev.phoneNumber,
        gender: data.gender !== undefined ? data.gender : (prev.gender || ""),
      }));
    }
  }, [data?.fullName, data?.phoneNumber, data?.gender]);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'fullName':
        const fullName = (value || "").trim();
        if (!fullName) {
          newErrors.fullName = 'Full name is required';
        } else if (fullName.length < 2) {
          newErrors.fullName = 'Full name should be at least 2 characters';
        } else {
          delete newErrors.fullName;
        }
        break;
        
      case 'phoneNumber':
        const phoneNumber = (value || "").trim();
        if (!phoneNumber) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phoneNumber)) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
        } else {
          delete newErrors.phoneNumber;
        }
        break;
        
      case 'gender':
        if (!value || !value.trim()) {
          newErrors.gender = 'Gender is required';
        } else {
          delete newErrors.gender;
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
    const fullName = (formData.fullName || "").trim();
    if (!fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.length < 2) {
      newErrors.fullName = 'Full name should be at least 2 characters';
    }
    
    // Validate phoneNumber
    const phoneNumber = (formData.phoneNumber || "").trim();
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    // Validate gender
    if (!formData.gender || !formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
    }
    
    setErrors(newErrors);
    setHasAttemptedSubmit(true);
    
    // Scroll to first error field if validation fails
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }, 100);
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    
    return isValid;
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    validateField(field, value);
    
    onChange(newData);
  };

  const getInputClassName = (field) => {
    return errors[field] ? 'border-red-500 focus:border-red-500' : '';
  };

  useImperativeHandle(ref, () => ({
    validateAllFields: () => {
      return validateAllFields();
    }
  }));

  return (
    <div className="space-y-4">
      <Typography variant="h6" className="text-gray-900 mb-2">
        Applicant Information
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Typography variant="small" className="text-primary mb-1 font-semibold">
            Full Name <span className="text-red-500">*</span>
          </Typography>
          <Input
            placeholder="Enter full name"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={getInputClassName('fullName')}
            name="fullName"
          />
          {errors.fullName && (
            <Typography variant="small" className="text-red-500 mt-1">
              {errors.fullName}
            </Typography>
          )}
        </div>

        <div>
          <Typography variant="small" className="text-primary mb-1 font-semibold">
            Phone Number <span className="text-red-500">*</span>
          </Typography>
          <Input
            placeholder="Enter phone number"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            className={getInputClassName('phoneNumber')}
            name="phoneNumber"
          />
          {errors.phoneNumber && (
            <Typography variant="small" className="text-red-500 mt-1">
              {errors.phoneNumber}
            </Typography>
          )}
        </div>

        <div>
          <Typography variant="small" className="text-primary mb-1 font-semibold">
            Gender <span className="text-red-500">*</span>
          </Typography>
          <select
            value={formData.gender || ""}
            onChange={(e) => handleChange('gender', e.target.value)}
            className={`w-full px-3 py-2.5 text-sm bg-transparent text-gray-700 focus:outline-none ${getInputClassName('gender')}`}
            name="gender"
            style={{
              border: errors.gender ? '1px solid #ef4444' : '1px solid #9ca3af',
              borderRadius: '6px',
              backgroundColor: 'transparent'
            }}
            required
          >
            <option value="" disabled className="text-gray-400 italic text-sm">
              Select gender
            </option>
            <option value="Male" className="text-gray-700 text-sm">Male</option>
            <option value="Female" className="text-gray-700 text-sm">Female</option>
          </select>
          {errors.gender && (
            <Typography variant="small" className="text-red-500 mt-1">
              {errors.gender}
            </Typography>
          )}
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
