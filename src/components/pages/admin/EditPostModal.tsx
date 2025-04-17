import React, { useState, useEffect } from 'react';

interface EditPostModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (header: string, body: string, section: string, amharicHeader?: string, amharicBody?: string) => Promise<void>;
  postToEdit: { id: string; header: string; body: string; section: string; amharicHeader?: string; amharicBody?: string };
}

const EditPostModal: React.FC<EditPostModalProps> = ({ show, onClose, onSave, postToEdit }) => {
  const [header, setHeader] = useState(postToEdit.header);
  const [body, setBody] = useState(postToEdit.body);
  const [section, setSection] = useState(postToEdit.section);
  const [amharicHeader, setAmharicHeader] = useState(postToEdit.amharicHeader || '');
  const [amharicBody, setAmharicBody] = useState(postToEdit.amharicBody || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeader(postToEdit.header);
    setBody(postToEdit.body);
    setSection(postToEdit.section);
    setAmharicHeader(postToEdit.amharicHeader || '');
    setAmharicBody(postToEdit.amharicBody || '');
  }, [postToEdit]);

  if (!show) return null;

  const handleSave = async () => {
    if (!header.trim() || !body.trim() || !section.trim()) {
      alert("Header, body, and section cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await onSave(header, body, section, amharicHeader, amharicBody);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-[42rem] max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Post</h2>
        <label className="block mb-1 font-medium text-blue-600">Header</label>
        <input
          type="text"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          placeholder="Header"
        />
        <label className="block mb-1 font-medium text-blue-600">Body</label>
        <textarea
          value={body}
          rows={8}
          onChange={(e) => setBody(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          placeholder="Body"
        />
        <label className="block mb-1 font-medium text-blue-600">Amharic Header (optional)</label>
        <input
          type="text"
          value={amharicHeader}
          onChange={(e) => setAmharicHeader(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          placeholder="Amharic Header (optional)"
        />
        <label className="block mb-1 font-medium text-blue-600">Amharic Body (optional)</label>
        <textarea
          value={amharicBody}
          rows={8}
          onChange={(e) => setAmharicBody(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          placeholder="Amharic Body (optional)"
        />
        <label className="block mb-1 font-medium text-blue-600">Section</label>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">Select Section</option>
          <option value="blog">Blog</option>
          <option value="home">Home</option>
          <option value="about">About</option>
          <option value="announcement">Announcement</option>
        </select>
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
