import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button, Typography, Card } from "@material-tailwind/react";
import { CloudArrowUpIcon, DocumentIcon, EyeIcon, VideoCameraIcon, MusicalNoteIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import PreviewModal from "../../requestManagement/document-preview-modal";
import { DOCUMENT_URL } from "../../../../config";

const DocumentsStep = forwardRef(({ data = {}, onChange, onValidationChange, onRemoveEvidence, hideAdditionalExplanation = false }, ref) => {
  const [documents, setDocuments] = useState(data.documents || []);
  const [damageDescription, setDamageDescription] = useState(data.damageDescription || "");
  const [signature, setSignature] = useState(data.signature || null);
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null });

  // Sync internal state with parent data when it changes
  useEffect(() => {
    if (data.documents !== undefined) {
      setDocuments(data.documents || []);
    }
    if (data.damageDescription !== undefined) {
      setDamageDescription(data.damageDescription || "");
    }
    if (data.signature !== undefined) {
      setSignature(data.signature || null);
    }
  }, [data.documents, data.damageDescription, data.signature]);

  const validateAllFields = () => {
    const newErrors = {};
    
    // Validate documents
    if (!documents || documents.length === 0) {
      newErrors.documents = 'Please upload at least one document';
    }
    
    // Validate additional information (optional field)
    if (damageDescription.trim() && damageDescription.trim().length < 10) {
      newErrors.damageDescription = 'Additional information should be at least 10 characters if provided';
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

  const handleDamageDescriptionChange = (value) => {
    setDamageDescription(value);
    onChange({ documents, damageDescription: value, signature });
    
    // Validate additional information (optional field)
    const newErrors = { ...errors };
    if (value.trim() && value.trim().length < 10) {
      newErrors.damageDescription = 'Additional information should be at least 10 characters if provided';
    } else {
      delete newErrors.damageDescription;
    }
    setErrors(newErrors);
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        const newErrors = { ...errors };
        newErrors.signature = 'Signature must be an image file';
        setErrors(newErrors);
        return;
      }
      
      // Clear any previous signature errors
      const newErrors = { ...errors };
      delete newErrors.signature;
      setErrors(newErrors);
      
      setSignature(file);
      onChange({ documents, damageDescription, signature: file });
    }
  };

  const handleRemoveSignature = () => {
    setSignature(null);
    onChange({ documents, damageDescription, signature: null });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('video/')) {
      return <VideoCameraIcon className="w-5 h-5 text-blue-500" />;
    } else if (fileType.startsWith('audio/')) {
      return <MusicalNoteIcon className="w-5 h-5 text-green-500" />;
    } else if (fileType.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-purple-500" />;
    } else {
      return <DocumentIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInputClassName = (field) => {
    return errors[field] ? 'border-red-500 focus:border-red-500' : '';
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Clear previous file size errors
    const newErrors = { ...errors };
    delete newErrors.documents;
    setErrors(newErrors);
    
    // Clear input immediately to prevent showing invalid files
    event.target.value = '';
    
    // File size limits in bytes
    const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
    
    // File extension mappings
    const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    
    // Helper function to get file extension
    const getFileExtension = (fileName) => {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
    };
    
    const invalidFiles = [];
    const validFiles = [];
    
    // Validate each file BEFORE adding to documents
    files.forEach(file => {
      const fileSize = file.size;
      const fileExtension = getFileExtension(file.name);
      let maxSize = 0;
      let fileType = '';
      let maxSizeMB = 0;
      
      // Determine file type and max size based on file extension
      if (VIDEO_EXTENSIONS.includes(fileExtension)) {
        maxSize = MAX_VIDEO_SIZE;
        fileType = 'video';
        maxSizeMB = 200;
      } else if (AUDIO_EXTENSIONS.includes(fileExtension)) {
        maxSize = MAX_AUDIO_SIZE;
        fileType = 'audio';
        maxSizeMB = 50;
      } else {
        // Documents, images, and other file types
        maxSize = MAX_DOCUMENT_SIZE;
        fileType = 'document';
        maxSizeMB = 10;
      }
      
      // Check file size - REJECT invalid files immediately
      if (fileSize > maxSize) {
        invalidFiles.push({
          name: file.name,
          size: fileSize,
          type: fileType,
          maxSize: maxSizeMB,
          actualSize: formatFileSize(fileSize)
        });
        // Invalid files are NOT added to validFiles - they are completely rejected
      } else {
        // Check for duplicates
        const isDuplicate = documents.some(doc => 
          doc.name === file.name && 
          doc.size === file.size &&
          doc.file instanceof File // Only check against uploaded files, not existing ones
        );
        
        if (!isDuplicate) {
          validFiles.push(file);
        }
      }
    });
    
    // Show error messages for invalid files
    if (invalidFiles.length > 0) {
      // Set error message in errors state to display inline like other errors
      const totalFiles = files.length;
      const invalidCount = invalidFiles.length;
      const errorMessage = totalFiles > 1 
        ? `${invalidCount}/${totalFiles} selected file${totalFiles > 1 ? 's' : ''} ${invalidCount > 1 ? 'are' : 'is'} too large`
        : 'Selected file is too large';
      setErrors({ ...errors, documents: errorMessage });
      
      // If no valid files, return early
      if (validFiles.length === 0) {
        return;
      }
    }
    
    // If no valid files, return early (input already cleared)
    if (validFiles.length === 0) {
      return;
    }
    
    // Only clear error if there were no invalid files
    // If there were invalid files, keep the error message to inform the user
    if (invalidFiles.length === 0) {
      const updatedErrors = { ...errors };
      delete updatedErrors.documents;
      setErrors(updatedErrors);
    }
    
    // ONLY add valid files to documents - invalid files are never added
    const newDocuments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      type: file.type,
      size: file.size,
      status: 'uploaded'
    }));
    
    const updatedDocuments = [...documents, ...newDocuments];
    setDocuments(updatedDocuments);
    onChange({ documents: updatedDocuments, damageDescription, signature });
  };

  const handleRemoveDocument = (id) => {
    const documentToRemove = documents.find(doc => doc.id === id);
    
    // If this is an existing document with complaint_evidence_id, add it to removal list
    if (documentToRemove && documentToRemove.complaint_evidence_id) {
      if (onRemoveEvidence) {
        onRemoveEvidence(documentToRemove.complaint_evidence_id);
      }
    }
    
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    onChange({ documents: updatedDocuments, damageDescription, signature });
  };

  const handlePreviewFile = async (doc) => {
    try {
      // For new uploads, use the file directly
      if (doc.file instanceof File) {
        setPreviewModal({ isOpen: true, file: doc.file });
        return;
      }
      
      // For existing documents, fetch from backend
      if (doc.fileUrl) {
        // Construct full URL using backend port
        const fullUrl = doc.fileUrl.startsWith('http') 
          ? doc.fileUrl 
          : `${DOCUMENT_URL}${doc.fileUrl.startsWith('/') ? '' : '/'}${doc.fileUrl}`;
        
        console.log("Fetching file from backend URL:", fullUrl);
        
        // Fetch the file from backend
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        // Get file data
        const blob = await response.blob();
        const fileName = doc.fileUrl.split('/').pop() || 'document';
        
        // Create a File object for the modal
        const file = new File([blob], fileName, { type: blob.type });
        
        // Open modal with the file
        setPreviewModal({ isOpen: true, file });
      }
    } catch (error) {
      console.error('Error fetching file:', error);
      // Fallback: try to open with URL directly
      if (doc.fileUrl) {
        const fullUrl = doc.fileUrl.startsWith('http') 
          ? doc.fileUrl 
          : `${DOCUMENT_URL}${doc.fileUrl.startsWith('/') ? '' : '/'}${doc.fileUrl}`;
        setPreviewModal({ isOpen: true, file: fullUrl });
      }
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null });
  };

  // Expose validation function to parent component
  useImperativeHandle(ref, () => ({
    validateAllFields: () => {
      return validateAllFields();
    }
  }));

  return (
    <>
      <div className="space-y-3">

        {/* Document Upload */}
        <div className="space-y-3">
          {/* <Typography variant="small" className="text-primary mb-1 font-semibold">
            Attach/Upload Your Evidence <span className="text-red-500">*</span>
          </Typography> */}
          
          {documents.length === 0 ? (
            // Large upload area when no documents
            <Card className="p-4 border-2 border-dashed border-primary bg-blue-50">
              <div className="text-center">
                <CloudArrowUpIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                <Typography variant="small" className="text-gray-700 mb-1 font-semibold">
                  Click here to upload 
                </Typography>
                <Typography variant="small" className="text-gray-500 mb-1 text-xs">
                  pdf, doc, images, videos, audio
                </Typography>
                <Typography variant="small" className="text-gray-600 mb-2 text-xs font-semibold">
                  Size limits: Documents/Images (max 10MB), Audio (max 50MB), Videos (max 200MB)
                </Typography>
                
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                
                <Button
                  onClick={() => document.getElementById('file-upload').click()}
                  className="bg-primary"
                >
                  Choose Files
                </Button>
              </div>
            </Card>
          ) : (
            // Compact add file button when documents exist
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudArrowUpIcon className="w-5 h-5 text-primary" />
                <Typography variant="small" className="text-gray-600">
                  Add more files to your evidence
                </Typography>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outlined"
                size="sm"
                onClick={() => document.getElementById('file-upload').click()}
                className="flex items-center gap-2"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                Add File
              </Button>
            </div>
          )}
          
          {errors.documents && (
            <Typography variant="small" className="text-red-500 mt-1">
              {errors.documents}
            </Typography>
          )}
        </div>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <Typography variant="small" className="text-primary mb-2 font-semibold">
              Uploaded Files ({documents.length})
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.type)}
                    </div>
                    
                    {/* File Name - takes available space */}
                    <div className="min-w-0 flex-1">
                      <Typography variant="small" className="text-gray-900 truncate text-xs" title={doc.name}>
                        {doc.name.split('/').pop().split('\\').pop()}
                      </Typography>
                    </div>
                    
                    {/* Action Buttons - on the same line */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="text"
                        size="sm"
                        className="flex items-center justify-center text-blue-600 hover:text-blue-800 p-1 min-w-[28px] h-7"
                        onClick={() => handlePreviewFile(doc)}
                        title="View"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="text"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveDocument(doc.id)}
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

        {/* Additional information */}
        {!hideAdditionalExplanation && (
          <div className="space-y-2">
            <Typography variant="small" className="text-primary mt-7 font-semibold">
              Additional Explanation <span className="text-gray-500">(Optional)</span>
            </Typography>
            
            <textarea
              className={`w-full p-2 border rounded-lg resize-none text-sm ${getInputClassName('damageDescription')}`}
              rows={4}
              placeholder="Enter any additional information about your complaint..."
              value={damageDescription}
              onChange={(e) => handleDamageDescriptionChange(e.target.value)}
            />
            {errors.damageDescription && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.damageDescription}
              </Typography>
            )}

          {/* Signature Upload */}
          {/* <div className="mt-4">
            <Typography variant="small" className="text-primary mb-2">
              Digital Signature
            </Typography>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
                id="signature-upload"
              />
              
              {signature ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 border rounded overflow-hidden">
                    <img 
                      src={URL.createObjectURL(signature)} 
                      alt="Signature preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Typography variant="small" className="text-gray-900 font-medium">
                      {signature.name}
                    </Typography>
                    <Button
                      variant="text"
                      size="sm"
                      color="red"
                      onClick={handleRemoveSignature}
                      className="p-0 h-auto text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => document.getElementById('signature-upload').click()}
                  className="flex items-center gap-2"
                >
                  <PhotoIcon className="w-4 h-4" />
                  Upload Signature
                </Button>
              )}
            </div>
            {errors.signature && (
              <Typography variant="small" className="text-red-500 mt-1">
                {errors.signature}
              </Typography>
            )}
          </div> */}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal} 
        />
      )}
    </>
  );
});

DocumentsStep.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onValidationChange: PropTypes.func,
  onRemoveEvidence: PropTypes.func,
  hideAdditionalExplanation: PropTypes.bool,
};

export default DocumentsStep;

