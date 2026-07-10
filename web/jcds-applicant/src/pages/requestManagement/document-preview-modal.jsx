import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const PreviewModal = ({ file, onClose, title, customStyle }) => {
    if (!file) return null;

    // Handle both File objects and URL strings
    const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
    
    // Extract fileName - for URLs, extract from path; for File objects, use file.name
    let fileName = '';
    if (typeof file === 'string') {
        // Extract filename from URL (remove query parameters and get last path segment)
        try {
            const url = new URL(file);
            const pathParts = url.pathname.split('/');
            fileName = pathParts[pathParts.length - 1] || '';
        } catch (e) {
            // If URL parsing fails, try simple string extraction
            const urlWithoutQuery = file.split('?')[0];
            const pathParts = urlWithoutQuery.split('/');
            fileName = pathParts[pathParts.length - 1] || '';
        }
    } else {
        fileName = file.name || '';
    }
    
    // Get file extension for better type detection
    const getFileExtension = (name) => {
        if (!name) return '';
        const lastDot = name.lastIndexOf('.');
        return lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';
    };

    const fileExtension = getFileExtension(fileName);

    // Video extensions
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
    // Audio extensions
    const audioExtensions = ['mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'];
    // Image extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

    // Determine file type based on extension or MIME type
    let fileType = typeof file === 'string' ? 'application/octet-stream' : (file.type || 'application/octet-stream');
    
    // Check file extension first (more reliable than MIME type)
    let detectedType = 'application/octet-stream';
    if (fileExtension === 'pdf') {
        detectedType = 'application/pdf';
    } else if (imageExtensions.includes(fileExtension)) {
        detectedType = 'image/' + fileExtension;
    } else if (videoExtensions.includes(fileExtension)) {
        detectedType = 'video/' + fileExtension;
    } else if (audioExtensions.includes(fileExtension)) {
        detectedType = 'audio/' + fileExtension;
    }
    
    // Use detected type from extension if MIME type is not reliable
    if (fileType === 'application/octet-stream' || !fileType || fileType === '') {
        fileType = detectedType;
    } else if (detectedType !== 'application/octet-stream' && !fileType.startsWith('image/') && !fileType.startsWith('video/') && !fileType.startsWith('audio/') && fileType !== 'application/pdf') {
        // If MIME type is generic but we have extension info, prefer extension
        fileType = detectedType;
    }

    const isVideo = fileType.startsWith('video/') || videoExtensions.includes(fileExtension);
    const isAudio = fileType.startsWith('audio/') || audioExtensions.includes(fileExtension);

    const renderPreview = () => {
        if (fileType.startsWith("image/")) {
            return (
                <img
                    src={fileUrl}
                    alt="File Preview"
                    className="object-contain w-full h-full"
                    aria-label="Image Preview"
                />
            );
        }

        if (fileType === "application/pdf") {
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

        if (isVideo) {
            return (
                <video
                    src={fileUrl}
                    controls
                    className="w-full h-full object-contain"
                    aria-label="Video Preview"
                >
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (isAudio) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <audio
                        src={fileUrl}
                        controls
                        className="w-full max-w-md"
                        aria-label="Audio Preview"
                    >
                        Your browser does not support the audio tag.
                    </audio>
                    <p className="mt-4 text-gray-600 text-sm">
                        {fileName || "Audio File"}
                    </p>
                </div>
            );
        }

        const officeFileExtensions = [
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".ppt",
            ".pptx",
        ];

        if (officeFileExtensions.includes(`.${fileExtension}`)) {
            // const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
            return (
                <iframe
                    src={fileUrl}
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
    };

    return createPortal(
        <>
            {customStyle && (
                <style>{`
                    @media (min-width: 640px) {
                        .preview-modal-custom {
                            transform: none !important;
                        }
                    }
                `}</style>
            )}
        <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center`}
            role="dialog"
            aria-modal="true"
            style={{ zIndex: 100 }}
        >
                <div 
                    className={`bg-white rounded-lg overflow-hidden flex flex-col ${
                        customStyle 
                            ? `preview-modal-custom w-[clamp(320px,90vw,900px)] ${isAudio ? 'h-auto min-h-[clamp(260px,45vh,420px)]' : 'h-[clamp(70vh,90vh,95vh)]'} shadow-lg` 
                            : `w-[clamp(320px,92vw,960px)] ${isAudio ? 'h-auto min-h-[clamp(240px,40vh,400px)]' : 'h-[clamp(70vh,90vh,95vh)]'} shadow-xl`
                    }`}
                    style={customStyle ? {
                        boxShadow: '0px 0px 11.18px 0px #3470FF29'
                    } : {}}
            >
                <div className="flex justify-between items-center p-[clamp(12px,1.6vw,16px)] border-b bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800" style={{ fontSize: "clamp(16px,1.1vw,20px)" }}>
                        {title || "File Preview"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-[clamp(8px,1vw,10px)] text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close Modal"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[clamp(20px,2vw,24px)] w-[clamp(20px,2vw,24px)]"
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

                <div 
                    className={`overflow-auto ${
                        customStyle 
                            ? `w-full ${isAudio ? 'h-auto sm:h-[clamp(260px,45vh,420px)]' : 'h-[calc(100%-clamp(64px,8vh,88px))] sm:h-[clamp(480px,72vh,760px)]'} p-[clamp(16px,2vw,24px)]` 
                            : `flex-1 p-[clamp(12px,2vw,16px)]`
                    }`}
                >
                    {renderPreview()}
                </div>


            </div>
        </div>
        </>
    , document.body);
};

export default PreviewModal;