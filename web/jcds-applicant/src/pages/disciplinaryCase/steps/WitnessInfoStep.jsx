import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Input, Button, Typography, Card } from "@material-tailwind/react";
import { PlusIcon, XMarkIcon, UserIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

const WitnessInfoStep = forwardRef(({ data = {}, onChange, onValidationChange, onRemoveWitness }, ref) => {
  const [witnesses, setWitnesses] = useState(data.witnesses || []);
  const [currentWitness, setCurrentWitness] = useState({
    fullName: "",
    phoneNumber: ""
  });
  const [errors, setErrors] = useState({});

  const validateAllFields = () => {
    // Witnesses are optional, so no overall validation for presence
    const isValid = true;
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    return isValid;
  };

  const validateCurrentWitness = () => {
    const newErrors = {};
    
    // Full name is optional, but if provided, must be at least 2 characters
    if (currentWitness.fullName.trim() && currentWitness.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name should be at least 2 characters';
    } else if (currentWitness.fullName.trim() && !/^[a-zA-Z\s\u1200-\u137F]+$/.test(currentWitness.fullName.trim())) {
      newErrors.fullName = 'Name should contain only letters and spaces';
    }
    
    // Phone number is optional, but if provided, must start with 09 or 07 and have exactly 10 digits
    if (currentWitness.phoneNumber.trim()) {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddWitness = () => {
    if (!validateCurrentWitness()) {
      return;
    }

    // Only add if at least one field is filled
    if (currentWitness.fullName.trim() || currentWitness.phoneNumber.trim()) {
      const newWitness = {
        id: Date.now() + Math.random(),
        fullName: currentWitness.fullName.trim(),
        phoneNumber: currentWitness.phoneNumber.trim().replace(/\s+/g, '') // Remove all spaces
      };
      const updatedWitnesses = [...witnesses, newWitness];
      setWitnesses(updatedWitnesses);
      onChange({ witnesses: updatedWitnesses });
      setCurrentWitness({ fullName: "", phoneNumber: "" });
      setErrors({}); // Clear errors after successful add
    }
  };

  const handleRemoveWitness = (id) => {
    const witnessToRemove = witnesses.find(witness => witness.id === id);
    
    // If this is an existing witness with complaint_witness_id, add it to removal list
    if (witnessToRemove && witnessToRemove.complaint_witness_id) {
      if (onRemoveWitness) {
        onRemoveWitness(witnessToRemove.complaint_witness_id);
      }
    }
    
    const newWitnesses = witnesses.filter(w => w.id !== id);
    setWitnesses(newWitnesses);
    onChange({ witnesses: newWitnesses });
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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Typography variant="h5" className="text-primary font-bold mb-2">
          Witness Information
        </Typography>
        <Typography variant="small" className="text-gray-600">
          Add witness details (Optional)
        </Typography>
      </div>

      {/* Add Witness Form */}
      <Card className="p-6 mb-6 shadow-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 max-w-[250px]">
              <Typography variant="small" className="text-primary mb-2 font-semibold">
                Full Name <span className="text-gray-500 font-normal text-xs">(Optional)</span>
              </Typography>
              <Input
                placeholder="Enter witness full name"
                value={currentWitness.fullName}
                onChange={(e) => setCurrentWitness(prev => ({ ...prev, fullName: e.target.value }))}
                className={`w-full max-w-[250px] ${getInputClassName('fullName')}`}
                containerProps={{ className: "w-full max-w-[250px]" }}
              />
              {errors.fullName && (
                <Typography variant="small" className="text-red-500 mt-1 text-xs">
                  {errors.fullName}
                </Typography>
              )}
            </div>

            <div className="flex-1 max-w-[250px]">
              <Typography variant="small" className="text-primary mb-2 font-semibold">
                Phone Number <span className="text-gray-500 font-normal text-xs">(Optional)</span>
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
                      newErrors.phoneNumber = 'Phone number must start with 09 / 07';
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
                className={`w-full max-w-[250px] ${getInputClassName('phoneNumber')}`}
                containerProps={{ className: "w-full max-w-[250px]" }}
              />
              {errors.phoneNumber && (
                <Typography variant="small" className="text-red-500 mt-1 text-xs">
                  {errors.phoneNumber}
                </Typography>
              )}
            </div>

            <div className="flex-shrink-0">
              <Button
                onClick={handleAddWitness}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all px-6 py-2.5"
                size="md"
              >
                <PlusIcon className="w-5 h-5" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Witnesses List */}
      {witnesses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="text-primary font-bold">
              Added Witnesses
            </Typography>
            <Typography variant="small" className="text-gray-500 bg-primary/10 px-3 py-1 rounded-full">
              {witnesses.length} {witnesses.length === 1 ? 'witness' : 'witnesses'}
            </Typography>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {witnesses.map((witness) => (
              <Card 
                key={witness.id} 
                className="p-4 shadow-md hover:shadow-lg transition-all border border-gray-200 hover:border-primary/30 bg-white"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <Typography variant="small" className="text-gray-900 font-semibold text-sm mb-2 break-words">
                      {witness.fullName || "N/A"}
                    </Typography>
                    <Typography variant="small" className="text-gray-600 text-xs mb-3">
                      <span className="font-medium">Phone:</span> {witness.phoneNumber || "N/A"}
                    </Typography>
                  </div>
                  <button
                    onClick={() => handleRemoveWitness(witness.id)}
                    className="w-full py-2 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 text-xs font-medium"
                    title="Remove witness"
                  >
                    <XMarkIcon className="w-4 h-4 inline mr-1" />
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {witnesses.length === 0 && (
        <Card className="p-8 text-center border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <Typography variant="small" className="text-gray-500">
            No witnesses added yet. Add witness information using the form above.
          </Typography>
        </Card>
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
