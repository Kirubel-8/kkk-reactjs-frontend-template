import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Input, Button, Typography, Card } from "@material-tailwind/react";
import { PlusIcon, UserIcon, TrashIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
 

const WitnessInfoStep = forwardRef(({ data = {}, onChange, onValidationChange, onRemoveWitness }, ref) => {
  const [witnesses, setWitnesses] = useState(data.witnesses || []);
  const [currentWitness, setCurrentWitness] = useState({
    fullName: "",
    phoneNumber: ""
  });
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  

  const validateAllFields = () => {
    // Witnesses are optional, so no validation needed
    const isValid = true;
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    return isValid;
  };

  const validateCurrentWitness = () => {
    const newErrors = {};
    
    if (!currentWitness.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(currentWitness.fullName.trim())) {
      newErrors.fullName = 'availabled characters are "a-zA-Z", " ", amharic letters, "/"';
    }
    
    // Phone number is required and must start with 09 or 07 and have exactly 10 digits
    if (!currentWitness.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const phoneNumber = currentWitness.phoneNumber.trim().replace(/\s+/g, ''); // Remove spaces
      
      // Check if it starts with 09 or 07
      if (!phoneNumber.startsWith('09') && !phoneNumber.startsWith('07')) {
        newErrors.phoneNumber = 'Phone number must start with 09 or 07';
      } else if (phoneNumber.length !== 10) {
        // Must have exactly 10 digits - no more, no less
        newErrors.phoneNumber = phoneNumber.length < 10 
          ? 'Phone number must have exactly 10 digits' 
          : 'Phone number must have exactly 10 digits (no more than 10)';
      } else if (!/^(09|07)\d{8}$/.test(phoneNumber)) {
        // Final check: must start with 09 or 07 and have exactly 10 digits
        newErrors.phoneNumber = 'Phone number must start with 09 or 07 and have exactly 10 digits (e.g., 0912345678)';
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleAddWitness = () => {
    // No maximum limit - witnesses are optional
    if (validateCurrentWitness()) {
      const newWitness = {
        ...currentWitness,
        id: Date.now(),
        phoneNumber: currentWitness.phoneNumber.trim().replace(/\s+/g, '') // Remove all spaces
      };
      const newWitnesses = [...witnesses, newWitness];
      setWitnesses(newWitnesses);
      onChange({ witnesses: newWitnesses });
      setCurrentWitness({
        fullName: "",
        phoneNumber: ""
      });
      
      // Clear any existing errors
      setErrors({});
    } else {
      // Show validation errors for current witness
      const newErrors = {};
      
      if (!currentWitness.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(currentWitness.fullName.trim())) {
        newErrors.fullName = 'availabled characters are "a-zA-Z", " ", amharic letters, "/"';
      }
      
      // Phone number validation
      if (!currentWitness.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      } else {
        const phoneNumber = currentWitness.phoneNumber.trim().replace(/\s+/g, '');
        
        if (!phoneNumber.startsWith('09') && !phoneNumber.startsWith('07')) {
          newErrors.phoneNumber = 'Phone number must start with 09 / 07';
        } else if (phoneNumber.length !== 10) {
          newErrors.phoneNumber = phoneNumber.length < 10 
            ? 'Phone number must have exactly 10 digits' 
            : 'Phone number must have exactly 10 digits (no more than 10)';
        } else if (!/^(09|07)\d{8}$/.test(phoneNumber)) {
          newErrors.phoneNumber = 'Phone number must start with 09 or 07 and have exactly 10 digits (e.g., 0912345678)';
        }
      }
      
      setErrors(newErrors);
    }
  };

  

  const handleRemoveWitness = (witnessId) => {
    const witnessToRemove = witnesses.find(witness => witness.id === witnessId);
    
    // If this is an existing witness with complaint_witness_id, add it to removal list
    if (witnessToRemove && witnessToRemove.complaint_witness_id) {
      if (onRemoveWitness) {
        onRemoveWitness(witnessToRemove.complaint_witness_id);
      }
    }
    
    const updatedWitnesses = witnesses.filter(witness => witness.id !== witnessId);
    setWitnesses(updatedWitnesses);
    onChange({ witnesses: updatedWitnesses });
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
        Witness Information
      </Typography> */}

      {/* Add Witness Form - No maximum limit */}
      <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Typography variant="small" className="text-primary mb-1 font-semibold">
                Full Name <span className="text-red-500">*</span>
              </Typography>
              <Input
                placeholder="Enter full name of the witness"
                value={currentWitness.fullName}
                onChange={(e) => setCurrentWitness(prev => ({ ...prev, fullName: e.target.value }))}
                className={getInputClassName('fullName')}
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
                placeholder="start with 09/07xxxxxxxx"
                value={currentWitness.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow digits and spaces
                  let cleanedValue = value.replace(/[^\d\s]/g, '');
                  
                  // Remove spaces to check actual digit count
                  const digitsOnly = cleanedValue.replace(/\s+/g, '');
                  
                  // Limit to exactly 10 digits maximum (prevent typing more than 10 digits)
                  if (digitsOnly.length > 10) {
                    // Keep only the first 10 digits, preserving spaces if any
                    let result = '';
                    let digitCount = 0;
                    for (let i = 0; i < cleanedValue.length && digitCount < 10; i++) {
                      if (/\d/.test(cleanedValue[i])) {
                        result += cleanedValue[i];
                        digitCount++;
                      } else if (cleanedValue[i] === ' ') {
                        result += cleanedValue[i];
                      }
                    }
                    cleanedValue = result;
                  }
                  
                  setCurrentWitness(prev => ({ ...prev, phoneNumber: cleanedValue }));
                  
                  // Real-time validation
                  if (cleanedValue.trim()) {
                    const phoneNumber = cleanedValue.trim().replace(/\s+/g, '');
                    const newErrors = { ...errors };
                    
                    // Check if it starts with 09 or 07
                    if (!phoneNumber.startsWith('09') && !phoneNumber.startsWith('07')) {
                      newErrors.phoneNumber = 'Phone number must start with 09 or 07';
                    } else if (phoneNumber.length < 10) {
                      // Less than 10 digits
                      newErrors.phoneNumber = 'Phone number must have exactly 10 digits';
                    } else if (phoneNumber.length > 10) {
                      // More than 10 digits (shouldn't happen, but just in case)
                      newErrors.phoneNumber = 'Phone number must have exactly 10 digits (no more than 10)';
                    } else if (!/^(09|07)\d{8}$/.test(phoneNumber)) {
                      // Exactly 10 digits but invalid format
                      newErrors.phoneNumber = 'Invalid phone number format';
                    } else {
                      // Valid phone number
                      delete newErrors.phoneNumber;
                    }
                    
                    setErrors(newErrors);
                  } else {
                    // Clear error if field is empty
                    const newErrors = { ...errors };
                    delete newErrors.phoneNumber;
                    setErrors(newErrors);
                  }
                }}
                maxLength={13} // Allow up to 13 characters (10 digits + 3 spaces for formatting)
                className={getInputClassName('phoneNumber')}
              />
              {errors.phoneNumber && (
                <Typography variant="small" className="text-red-500 mt-1">
                  {errors.phoneNumber}
                </Typography>
              )}
            </div>
          </div>

          <Button
            onClick={handleAddWitness}
            className="flex items-center gap-2 bg-primary"
            size="sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </Button>
        </div>

      {/* Witnesses List */}
      {witnesses.length > 0 && (
        <div className="space-y-3">
          <Typography variant="small" className="text-primary mb-2 font-semibold">
            Added Witnesses ({witnesses.length})
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {witnesses.map((witness, index) => (
              <Card key={witness.id} className="p-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Witness Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Witness Name and Phone - takes available space */}
                  <div className="min-w-0 flex-1">
                    <Typography variant="small" className="text-gray-900 truncate text-xs" title={witness.fullName}>
                      {witness.fullName}
                    </Typography>
                    <Typography variant="small" className="text-gray-600 text-xs truncate" title={witness.address}>
                      {witness.phoneNumber}
                    </Typography>
                  </div>
                  
                  {/* Action Button - on the same line */}
                  <div className="flex items-center flex-shrink-0">
                    <Button
                      variant="text"
                      color="red"
                      size="sm"
                      onClick={() => handleRemoveWitness(witness.id)}
                      className="hover:text-red-800 p-1 min-w-[28px] h-7 flex items-center justify-center"
                      title="Remove"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {errors.witnesses && (
        <Typography variant="small" className="text-red-500 mt-1">
          {errors.witnesses}
        </Typography>
      )}
      
    </div>
  );
});

WitnessInfoStep.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onValidationChange: PropTypes.func,
  onRemoveWitness: PropTypes.func,
};

export default WitnessInfoStep;
