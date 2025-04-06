import React, { useState } from 'react';

interface AddBoardMemberModalProps {
  onClose: () => void;
  onSave: (member: { nameEn: string; nameAm: string; role: string; image: File | null }) => Promise<void>;
}

const AddBoardMemberModal: React.FC<AddBoardMemberModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAm: '',
    role: '',
    image: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    if (!formData.nameEn || !formData.nameAm || !formData.role || !formData.image) {
      setError('All fields are required.');
      return false;
    }
    if (formData.image) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webm'];
      if (!validImageTypes.includes(formData.image.type)) {
        setError('Only image files (JPEG, PNG, GIF, JPG, WEBM) are allowed.');
        return false;
      }
      if (formData.image.size > 5 * 1024 * 1024) {
        setError('Image size must be under 5MB.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Board Member</h3>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="space-y-4">
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
            <input
              type="text"
              id="nameEn"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="nameAm" className="block text-sm font-medium text-gray-700 mb-1">Name (Amharic)</label>
            <input
              type="text"
              id="nameAm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.nameAm}
              onChange={(e) => setFormData({ ...formData, nameAm: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <input
              type="file"
              id="image"
              className="w-full text-sm"
              onChange={(e) => setFormData({ ...formData, image: e.target.files ? e.target.files[0] : null })}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBoardMemberModal;
