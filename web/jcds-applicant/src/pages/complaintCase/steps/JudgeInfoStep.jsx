import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Input, Textarea, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";
import caseTypeService from "../../../service/caseType.service";
import EtDatePicker, { EtLocalizationProvider } from "habesha-datepicker-v2";

const JudgeInfoStep = forwardRef(({ data = {}, onChange, onValidationChange }, ref) => {
  const [formData, setFormData] = useState({
    judgeFullName: data.judgeFullName || "",
    servingPlace: data.servingPlace || "",
    caseFileNumber: data.caseFileNumber || "",
    incidentDate: data.incidentDate || "",
    caseType: data.caseType || "",
    ...data
  });

  // Update formData when data prop changes (e.g., when navigating back)
  useEffect(() => {
    // Sync all fields from data prop to internal state
    if (data && Object.keys(data).length > 0) {
      console.log("JudgeInfoStep: Syncing data prop to internal state", data);
      
      setFormData(prev => {
        const newData = {
          judgeFullName: data.judgeFullName !== undefined ? data.judgeFullName : prev.judgeFullName,
          servingPlace: data.servingPlace !== undefined ? data.servingPlace : prev.servingPlace,
          caseFileNumber: data.caseFileNumber !== undefined ? data.caseFileNumber : prev.caseFileNumber,
          incidentDate: data.incidentDate !== undefined ? data.incidentDate : prev.incidentDate,
          caseType: data.caseType !== undefined ? data.caseType : prev.caseType,
        };
        console.log("JudgeInfoStep: Updated internal state", newData);
        return newData;
      });
    }
  }, [
    data?.judgeFullName,
    data?.servingPlace,
    data?.caseFileNumber,
    data?.incidentDate,
    data?.caseType
  ]);

  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [caseTypes, setCaseTypes] = useState([]);
  const [loadingCaseTypes, setLoadingCaseTypes] = useState(false);

  // Court office options (dummy data)
  const courtOffices = [
    "Federal Supreme Court",
    "Federal High Court",
    "Federal First Instance Court",
    "Addis Ababa Supreme Court",
    "Addis Ababa High Court",
    "Addis Ababa First Instance Court",
  ];

  // Fetch case types from backend
  useEffect(() => {
    const fetchCaseTypes = async () => {
      try {
        setLoadingCaseTypes(true);
        const response = await caseTypeService.getAllCaseTypes();
        setCaseTypes(response.data || response);
      } catch (error) {
        console.error('Error fetching case types:', error);
        // Set fallback case types
        setCaseTypes([
          { case_type_id: 'fallback-1', name: 'Criminal Case' },
          { case_type_id: 'fallback-2', name: 'Civil Case' },
          { case_type_id: 'fallback-3', name: 'Administrative Case' },
          { case_type_id: 'fallback-4', name: 'Constitutional Case' },
          { case_type_id: 'fallback-5', name: 'Commercial Case' }
        ]);
      } finally {
        setLoadingCaseTypes(false);
      }
    };

    fetchCaseTypes();
  }, []);


  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          newErrors.firstName = 'First name should be at least 2 characters';
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          newErrors.lastName = 'Last name should be at least 2 characters';
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'phoneNumber':
        if (!value.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(value.trim())) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
        } else {
          delete newErrors.phoneNumber;
        }
        break;

      case 'email':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            newErrors.email = 'Please enter a valid email address';
          } else {
            delete newErrors.email;
          }
        } else {
          delete newErrors.email; // Email is optional
        }
        break;

      case 'gender':
        // Gender is optional - no validation needed
        delete newErrors.gender;
        break;

      case 'judgeFullName':
        if (!value.trim()) {
          newErrors.judgeFullName = 'Judge Full Name is required';
        } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(value.trim())) {
          newErrors.judgeFullName = 'availabled characters are "a-zA-Z", " ", amharic letters, "/"';
        } else if (value.trim().length < 2) {
          newErrors.judgeFullName = 'Name is too short';
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
        if (!value.trim()) {
          newErrors.caseFileNumber = 'Case file number is required';
        } else if (value.trim().length < 3) {
          newErrors.caseFileNumber = 'case file number is too short';
        } else {
          delete newErrors.caseFileNumber;
        }
        break;
        
      case 'incidentDate':
        if (!value) {
          newErrors.incidentDate = 'Time of incident is required';
        } else {
          // Parse date string in local timezone
          let selectedDate;
          if (typeof value === 'string' && value.includes('-')) {
            const [year, month, day] = value.split('-').map(Number);
            selectedDate = new Date(year, month - 1, day);
          } else {
            selectedDate = new Date(value);
          }
          
          const today = new Date();
          today.setHours(23, 59, 59, 999); // Set to end of today
          
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(today.getFullYear() - 4);
          twoYearsAgo.setHours(0, 0, 0, 0); // Set to start of day
          
          if (selectedDate > today) {
            newErrors.incidentDate = 'Incident date cannot be in the future';
          } else if (selectedDate < twoYearsAgo) {
            newErrors.incidentDate = 'Date of offense cannot be more than 4 years ago';
          } else {
            delete newErrors.incidentDate;
          }
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
        // Region is optional - no validation needed
        delete newErrors.region;
        break;

      case 'zone':
        // Zone is optional - no validation needed
        delete newErrors.zone;
        break;

      case 'woreda':
        // Woreda is optional - no validation needed
        delete newErrors.woreda;
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllFields = () => {
    const newErrors = {};
    console.log("JudgeInfoStep validateAllFields - formData:", formData);
    
    // Validate judgeFullName
    const judgeFullName = (formData.judgeFullName || "").trim();
    if (!judgeFullName) {
      newErrors.judgeFullName = 'Judge Full Name is required';
    } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(judgeFullName)) {
      newErrors.judgeFullName = 'availabled characters are "a-zA-Z", " ", amharic letters, "/"';
    } else if (judgeFullName.length < 2) {
      newErrors.judgeFullName = 'Name should be at least 2 characters';
    }
    
    // Validate servingPlace
    if (!formData.servingPlace) {
      newErrors.servingPlace = 'court office must be selected';
    }
    
    // Validate caseFileNumber
    const caseFileNumber = (formData.caseFileNumber || "").trim();
    if (!caseFileNumber) {
      newErrors.caseFileNumber = 'Case file number is required';
    } else if (caseFileNumber.length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    // Validate incidentDate
    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Time of incident is required';
    } else {
      // Parse date string in local timezone
      let selectedDate;
      if (typeof formData.incidentDate === 'string' && formData.incidentDate.includes('-')) {
        const [year, month, day] = formData.incidentDate.split('-').map(Number);
        selectedDate = new Date(year, month - 1, day);
      } else {
        selectedDate = new Date(formData.incidentDate);
      }
      
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(today.getFullYear() - 4);
      twoYearsAgo.setHours(0, 0, 0, 0); // Set to start of day
      
      if (selectedDate > today) {
        newErrors.incidentDate = 'Incident date cannot be in the future';
      } else if (selectedDate < twoYearsAgo) {
        newErrors.incidentDate = 'Date of offense cannot be more than 4 years ago';
      }
    }
    
    // Validate caseType
    if (!formData.caseType) {
      newErrors.caseType = 'case type must be selected';
    }
    
    // Region, Zone, and Woreda are optional - no validation needed
    
    setErrors(newErrors);
    setHasAttemptedSubmit(true);
    
    // Scroll to first error field if validation fails
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"], input[placeholder*="${firstErrorField}"], select[value*="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        } else {
          // Try to find by field name in the component
          const fieldInputs = document.querySelectorAll('input, select, textarea');
          for (let input of fieldInputs) {
            if (input.value === formData[firstErrorField] || input.placeholder?.toLowerCase().includes(firstErrorField.toLowerCase())) {
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              input.focus();
              break;
            }
          }
        }
      }, 100);
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    
    // Notify parent about validation status
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    
    return isValid;
  };

  const handleChange = (field, value) => {
    console.log(`handleChange called for field: ${field}, value:`, value);
    
    // Convert Date object to local date string (YYYY-MM-DD) for date fields
    let processedValue = value;
    if (field === 'incidentDate') {
      if (value instanceof Date) {
        // Format date in local timezone to avoid timezone offset issues
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        processedValue = `${year}-${month}-${day}`;
      } else if (value === null) {
        processedValue = '';
      }
    }
    
    const newData = { ...formData, [field]: processedValue };
    setFormData(newData);
    
    // Validate the field
    validateField(field, processedValue);
    
    onChange(newData);
  };

  // Convert date string (YYYY-MM-DD) to Date object for the date picker
  const getDateValue = () => {
    if (!formData.incidentDate) return null;
    try {
      // Parse date string in local timezone to avoid timezone offset issues
      const dateStr = formData.incidentDate;
      if (dateStr.includes('T')) {
        // If it's an ISO string, parse it in local time
        const date = new Date(dateStr);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        // If it's YYYY-MM-DD format, parse it directly in local time
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
    } catch (e) {
      return null;
    }
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
    <div className="space-y-4">
      {/* Judge Information Section */}
      <div className="space-y-4">
        <Typography variant="h6" className="text-gray-900 mb-2">
          Judge Information
        </Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Full Name <span className="text-red-500">*</span>
            </Typography>
            <Input
              placeholder="     Enter judge full name"
              value={formData.judgeFullName}
              onChange={(e) => handleChange('judgeFullName', e.target.value)}
              className={getInputClassName('judgeFullName')}
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
            <select
              value={formData.servingPlace || ""}
              onChange={(e) => handleChange('servingPlace', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm bg-transparent text-gray-700 focus:outline-none ${getInputClassName('servingPlace')}`}
              style={{
                border: errors.servingPlace ? '1px solid #ef4444' : '1px solid #9ca3af',
                borderRadius: '6px',
                backgroundColor: 'transparent'
              }}
            >
              <option value="" disabled className="text-gray-400 italic text-sm">
                Select Court Office
              </option>
              {courtOffices.map((office, index) => (
                <option 
                  key={index} 
                  value={office}
                  className="text-gray-700 text-sm"
                >
                  {office}
                </option>
              ))}
            </select>
            {errors.servingPlace && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.servingPlace}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Case Type <span className="text-red-500">*</span>
            </Typography>
            <select
              value={formData.caseType || ""}
              onChange={(e) => {
                console.log('Native select onChange triggered with value:', e.target.value);
                handleChange('caseType', e.target.value);
              }}
              className={`w-full px-3 py-2.5 text-sm bg-transparent text-gray-700 focus:outline-none ${getInputClassName('caseType')}`}
              disabled={loadingCaseTypes}
              style={{
                border: '1px solid #9ca3af',
                borderRadius: '6px',
                backgroundColor: 'transparent'
              }}
            >
              <option value="" disabled className="text-gray-400 italic text-sm">
                {loadingCaseTypes ? 'Loading case types...' : 'Select the case type'}
              </option>
              {caseTypes.map((caseType) => (
                <option 
                  key={caseType.case_type_id} 
                  value={caseType.name}
                  className="text-gray-700 text-sm"
                >
                  {caseType.name}
                </option>
              ))}
            </select>
            {errors.caseType && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.caseType}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Case File Number <span className="text-red-500">*</span>
            </Typography>
            <Input
              placeholder="     Enter file number"
              value={formData.caseFileNumber}
              onChange={(e) => handleChange('caseFileNumber', e.target.value)}
              className={getInputClassName('caseFileNumber')}
            />
            {errors.caseFileNumber && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.caseFileNumber}
              </Typography>
            )}
          </div>

          <div>
            <Typography variant="small" className="text-primary mb-1 font-semibold">
              Date of Offense <span className="text-red-500">*</span>
            </Typography>
            <EtLocalizationProvider localType="EC">
              <EtDatePicker
                label="Select Date"
                value={getDateValue()}
                onChange={(date) => handleChange('incidentDate', date)}
                minDate={new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000)}
                maxDate={new Date()}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    borderColor: errors.incidentDate ? '#ef4444' : '#9ca3af',
                    backgroundColor: 'transparent',
                    '& fieldset': {
                      borderColor: errors.incidentDate ? '#ef4444' : '#9ca3af',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.incidentDate ? '#ef4444' : '#9ca3af',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.incidentDate ? '#ef4444' : '#1E516A',
                      borderWidth: '1px',
                    },
                    '& input': {
                      padding: '10.5px 0px 10.5px 1.5px',
                      fontSize: '15px',
                      height: '100%',
                    },
                    '& .MuiInputAdornment-root': {
                      marginRight: '0px',
                      marginLeft: '0px',
                      '& .MuiIconButton-root': {
                        padding: '0px',
                      }
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                    '&.Mui-focused': {
                      color: errors.incidentDate ? '#ef4444' : '#1E516A',
                    }
                  }
                }}
              />
            </EtLocalizationProvider>
            {errors.incidentDate && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.incidentDate}
              </Typography>
            )}
          </div>
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
