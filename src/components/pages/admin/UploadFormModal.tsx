import React, { useState } from 'react';

interface UploadFormModalProps {
  show: boolean;
  onClose: () => void;
  onUpload: (form: { nameAm: string; nameEn: string; file: File | null; description: string }) => void;
  formData: { nameAm: string; nameEn: string; file: File | null; description: string };
  setFormData: (form: { nameAm: string; nameEn: string; file: File | null; description: string }) => void;
}

const UploadFormModal: React.FC<UploadFormModalProps> = ({ show, onClose, onUpload, formData, setFormData }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleUpload = async () => {
    if (!formData.nameAm.trim() || !formData.nameEn.trim() || !formData.file) {
      alert('Please fill all required fields and select a file.');
      return;
    }
    setIsLoading(true);
    try {
      await onUpload(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Upload New Form</h2>
        <input
          type="text"
          placeholder="Form Name (Amharic)"
          value={formData.nameAm}
          onChange={e => setFormData({ ...formData, nameAm: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Form Name (English)"
          value={formData.nameEn}
          onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="file"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={e => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })}
          className="w-full mb-4"
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadFormModal;
