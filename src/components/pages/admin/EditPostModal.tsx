import React, { useState, useEffect } from 'react';

interface EditPostModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (header: string, body: string) => Promise<void>;
  postToEdit: { id: string; header: string; body: string };
}

const EditPostModal: React.FC<EditPostModalProps> = ({ show, onClose, onSave, postToEdit }) => {
  const [header, setHeader] = useState(postToEdit.header);
  const [body, setBody] = useState(postToEdit.body);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeader(postToEdit.header);
    setBody(postToEdit.body);
  }, [postToEdit]);

  if (!show) return null;

  const handleSave = async () => {
    if (!header.trim() || !body.trim()) {
      alert("Header and body cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await onSave(header, body);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Edit Post</h2>
        <input
          type="text"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <textarea
          value={body}
          rows={8}
          onChange={(e) => setBody(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded text-white ${saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
