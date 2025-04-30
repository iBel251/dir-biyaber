import React, { useState } from 'react';

interface EditFormModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (fields: { nameAm: string; nameEn: string; description: string }) => Promise<void>;
  initialValues: { nameAm: string; nameEn: string; description: string };
}

const EditFormModal: React.FC<EditFormModalProps> = ({ show, onClose, onSave, initialValues }) => {
  const [fields, setFields] = useState(initialValues);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setFields(initialValues);
  }, [initialValues, show]);

  const handleSave = async () => {
    setIsLoading(true);
    await onSave(fields);
    setIsLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit Form</h2>
        <input
          type="text"
          placeholder="Form Name (Amharic)"
          value={fields.nameAm}
          onChange={e => setFields({ ...fields, nameAm: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Form Name (English)"
          value={fields.nameEn}
          onChange={e => setFields({ ...fields, nameEn: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <textarea
          placeholder="Description"
          value={fields.description}
          onChange={e => setFields({ ...fields, description: e.target.value })}
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
            onClick={handleSave}
            className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFormModal;
