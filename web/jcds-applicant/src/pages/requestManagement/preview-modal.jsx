const PreviewModal = ({ isOpen, onClose, documentUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Preview Document</h3>
          <button onClick={onClose} className="text-red-500 text-2xl font-bold">
            &times;
          </button>
        </div>
        <div className="mt-4">
          <iframe
            src={documentUrl}
            title="Document Preview"
            width="100%"
            height="500px"
            className="border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
