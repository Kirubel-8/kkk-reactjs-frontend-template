import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Button, Typography, Card } from "@material-tailwind/react";
import { CloudArrowUpIcon, DocumentIcon, EyeIcon, VideoCameraIcon, MusicalNoteIcon, PhotoIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import PreviewModal from "../../requestManagement/document-preview-modal";
import { DOCUMENT_URL } from "../../../../config";

const DocumentsStep = forwardRef(({ data = {}, onChange, onValidationChange }, ref) => {
  const [documents, setDocuments] = useState(data.documents || []);
  const [additionalInformation, setAdditionalInformation] = useState(data.additionalInformation || "");
  const [signature, setSignature] = useState(data.signature || null);
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null });

  // Update state when data changes (for edit mode)
  useEffect(() => {
    if (data.documents) {
      setDocuments(data.documents);
    }
    if (data.additionalInformation !== undefined) {
      setAdditionalInformation(data.additionalInformation);
    }
    if (data.signature !== undefined) {
      setSignature(data.signature);
    }
  }, [data]);

  const validateAllFields = () => {
    const newErrors = {};
    
    // Documents are now optional - no validation required
    
    // Validate additional information (optional field)
    if (additionalInformation.trim() && additionalInformation.trim().length < 10) {
      newErrors.additionalInformation = 'Description should be at least 10 characters if provided';
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

  const handleAdditionalInformationChange = (value) => {
    setAdditionalInformation(value);
    onChange({ documents, additionalInformation: value, signature });
    
    // Validate additional information (optional field)
    const newErrors = { ...errors };
    if (value.trim() && value.trim().length < 10) {
      newErrors.additionalInformation = 'Description should be at least 10 characters if provided';
    } else {
      delete newErrors.additionalInformation;
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
      onChange({ documents, additionalInformation, signature: file });
    }
  };

  const handleRemoveSignature = () => {
    setSignature(null);
    onChange({ documents, additionalInformation, signature: null });
  };

  const getFileIcon = (fileType) => {
    // Handle undefined or null fileType
    if (!fileType) {
      return <DocumentIcon className="w-5 h-5 text-red-500" />;
    }
    
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
    
    // Filter out duplicate files based on name and size
    const newFiles = files.filter(file => {
      const isDuplicate = documents.some(doc => 
        doc.name === file.name && 
        doc.size === file.size &&
        doc.file instanceof File // Only check against uploaded files, not existing ones
      );
      return !isDuplicate;
    });
    
    if (newFiles.length === 0) {
      // Clear the input
      event.target.value = '';
      return;
    }
    
    const newDocuments = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      type: file.type,
      size: file.size,
      status: 'uploaded'
    }));
    
    const updatedDocuments = [...documents, ...newDocuments];
    setDocuments(updatedDocuments);
    onChange({ documents: updatedDocuments, additionalInformation, signature });
    
    // Clear the input
    event.target.value = '';
  };

  const handleRemoveDocument = (id) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    onChange({ documents: updatedDocuments, additionalInformation, signature });
  };

  const handlePreviewFile = async (doc) => {
    console.log("Previewing document:", doc);
    
    // For new files (doc.file exists)
    if (doc.file) {
      setPreviewModal({ isOpen: true, file: doc.file });
    } 
    // For existing files from API (doc.fileUrl exists)
    else if (doc.fileUrl) {
      try {
        // Construct full URL using backend port
        const fullUrl = doc.fileUrl.startsWith('http') 
          ? doc.fileUrl 
          : `${DOCUMENT_URL}${doc.fileUrl.startsWith('/') ? '' : '/'}${doc.fileUrl}`;
        
        console.log("Fetching existing file from backend URL:", fullUrl);
        
        // Fetch the file from backend
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        // Get file data
        const blob = await response.blob();
        const fileName = doc.name || doc.fileUrl.split('/').pop() || 'document';
        
        // Create a File object for the modal
        const file = new File([blob], fileName, { type: blob.type });
        
        // Open modal with the file
        setPreviewModal({ isOpen: true, file });
        
      } catch (error) {
        console.error("Error fetching existing file:", error);
        toast.error("Failed to load file");
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
        {/* <Typography variant="h5" className="text-gray-900 mb-6">
          Attach Documents
        </Typography> */}

        {/* Document Upload */}
        <div className="space-y-3 mt-2">
          <Typography variant="small" className="text-primary mb-1 font-semibold">
            Attach/Upload Your Evidence <span className="text-gray-500">(Optional)</span>
          </Typography>
          
          {documents.length === 0 ? (
            // Large upload area when no documents
            <Card className="p-4 border-2 border-dashed border-primary bg-blue-50">
              <div className="text-center">
                <CloudArrowUpIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                <Typography variant="small" className="text-gray-700 mb-1 font-semibold">
                  Click here to upload
                </Typography>
                <Typography variant="small" className="text-gray-500 mb-2 text-xs">
                  Supported formats: Documents (PDF, DOC, DOCX), Images (JPG, PNG, GIF, BMP, TIFF), Videos (MP4, AVI, MOV, WMV, FLV, WEBM, MKV), Audio (MP3, WAV, FLAC, AAC, OGG, M4A, WMA)
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-2 hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    {/* File Icon and Name in one line */}
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="min-w-0">
                        <Typography variant="small" className="text-gray-900 truncate text-xs" title={doc.name || 'Document'}>
                          {doc.name ? doc.name.split('/').pop().split('\\').pop() : 'Document'}
                        </Typography>
                        <Typography variant="small" className="text-gray-600 text-[10px] leading-tight">
                          {formatFileSize(doc.size || 0)}
                        </Typography>
                      </div>
                    </div>
                    
                    {/* Action Buttons bottom-right */}
                    <div className="flex items-center justify-end gap-2 mt-auto">
                      <Button
                        variant="text"
                        size="sm"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => handlePreviewFile(doc)}
                      >
                        <EyeIcon className="w-3 h-3" />
                        <span className="text-xs">View</span>
                      </Button>
                      <Button
                        variant="text"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="hover:text-red-800 p-1"
                      >
                        <span className="text-xs">Remove</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Additional information */}
        <div className="space-y-2">
          <Typography variant="small" className="text-primary mt-7 font-semibold">
            Additional Description <span className="text-gray-500">(Optional)</span>
          </Typography>
          
          <textarea
            className={`w-full p-2 border rounded-lg resize-none text-sm ${getInputClassName('additionalInformation')}`}
            rows={4}
            placeholder="Enter any additional information about your disciplinary case..."
            value={additionalInformation}
            onChange={(e) => handleAdditionalInformationChange(e.target.value)}
          />
          {errors.additionalInformation && (
            <Typography variant="small" className="text-red-500 mt-1">
              {errors.additionalInformation}
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
};

export default DocumentsStep;
