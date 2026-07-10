const EditDocumentPreviewModal = ({ file, onClose }) => {
  if (!file) return null;

  const renderPreview = () => {
    // Check if this is an API response object with document_type
    if (
      file.document_type === "complaint document" ||
      file.request_document_url
    ) {
      const fileExtension = file.request_document_url
        .split(".")
        .pop()
        .toLowerCase();

      if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
        return (
          <img
            src={file.request_document_url}
            alt="Document Preview"
            className="object-contain w-full h-full"
            aria-label="Image Preview"
          />
        );
      }

      if (fileExtension === "pdf") {
        return (
          <iframe
            src={file.request_document_url}
            width="100%"
            height="100%"
            frameBorder="0"
            title="PDF Preview"
            aria-label="PDF Document Preview"
          />
        );
      }

      const officeFileExtensions = [
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
      ];
      if (officeFileExtensions.includes(fileExtension)) {
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
              file.request_document_url
            )}`}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Office File Preview"
            aria-label="Office Document Preview"
          />
        );
      }

      // Fallback for unsupported file types
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-600 text-lg">
            Preview not available for this file type.
          </p>
        </div>
      );
    }

    // Original handling for File objects (kept for backward compatibility)
    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={fileUrl}
          alt="File Preview"
          className="object-contain w-full h-full"
          aria-label="Image Preview"
        />
      );
    }

    if (file.type === "application/pdf") {
      return (
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title="PDF Preview"
          aria-label="PDF Document Preview"
        />
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-600 text-lg">
          Preview not available for this file type.
        </p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[90%] md:w-[70%] lg:w-[50%] h-[90%] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">File Preview</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close Modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-auto">{renderPreview()}</div>
      </div>
    </div>
  );
};

export default EditDocumentPreviewModal;
