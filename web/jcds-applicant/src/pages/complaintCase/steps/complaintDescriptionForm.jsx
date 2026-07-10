import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Typography, Textarea } from "@material-tailwind/react";

const ComplaintDescriptionForm = forwardRef(({ formData = {}, onChange }, ref) => {
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    let error = "";
    
    switch (field) {
      case "description":
        if (!value || value.trim() === "") {
          error = "Description is required";
        } else if (value.trim().length < 10) {
          error = "Description is too short";
        }
        break;
      case "damageDescription":
        if (!value || value.trim() === "") {
          error = "Damage description is required";
        } else if (value.trim().length < 10) {
          error = "Description is too short";
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === "";
  };

  const validateAllFields = () => {
    console.log("ComplaintDescriptionForm validateAllFields - formData:", formData);
    const descriptionValid = validateField("description", formData?.description || "");
    const damageDescriptionValid = validateField("damageDescription", formData?.damageDescription || "");
    
    console.log("ComplaintDescriptionForm validation results:", {
      descriptionValid,
      damageDescriptionValid,
      description: formData?.description,
      damageDescription: formData?.damageDescription
    });
    
    return descriptionValid && damageDescriptionValid;
  };

  const handleChange = (field, value) => {
    // Update form data
    onChange({
      ...formData,
      [field]: value
    });
    
    // Validate field in real-time as user types
    validateField(field, value);
  };

  const getInputClassName = (field) => {
    return `w-full ${errors[field] ? "border-red-500" : "border-gray-300"} focus:border-primary`;
  };

  useImperativeHandle(ref, () => ({
    validateAllFields: validateAllFields,
    isFormValid: () => {
      return formData.description && 
             formData.description.trim().length >= 10 &&
             formData.damageDescription && 
             formData.damageDescription.trim().length >= 10;
    }
  }));

  return (
    <div className="space-y-3">
      {/* Description Field - Full Width */}
      <div>
        <Typography variant="small" className="text-primary mb-1 font-semibold">
          Act Details <span className="text-red-500">*</span>
        </Typography>
        <Textarea
          placeholder="Provide a detailed explanation of how the corruption, bribery, graft, or inducement occurred"
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

      {/* Damage Description Field - Full Width */}
      <div>
        <Typography variant="small" className="text-primary mb-1 font-semibold">
          Damage Detail <span className="text-red-500">*</span>
        </Typography>
        <Textarea
          placeholder="Describe the damage caused due to corruption, bribery, graft, or inducement"
          value={formData.damageDescription}
          onChange={(e) => handleChange('damageDescription', e.target.value)}
          className={getInputClassName('damageDescription')}
          required
          rows={3}
        />
        {errors.damageDescription && (
          <Typography variant="small" className="text-red-500 mt-1">
            {errors.damageDescription}
          </Typography>
        )}
      </div>
    </div>
  );
});

ComplaintDescriptionForm.displayName = "ComplaintDescriptionForm";

export default ComplaintDescriptionForm;
