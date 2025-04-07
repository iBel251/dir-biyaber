import React, { useState } from 'react';

interface AddObituaryModalProps {
  onClose: () => void;
  onSave: (obituary: { nameEn: string; nameAm: string; birthYear: string; deathDate: string; number: string; image: File | null }) => Promise<void>;
}

const AddObituaryModal: React.FC<AddObituaryModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAm: '',
    birthYear: '',
    deathDate: '',
    number: '',
    image: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    const nameRegex = /^[^\d]+$/; // Regex to ensure no numbers in names
    if (!formData.nameEn || !nameRegex.test(formData.nameEn)) {
      setError('Name (English) cannot contain numbers.');
      return false;
    }
    if (!formData.nameAm || !nameRegex.test(formData.nameAm)) {
      setError('Name (Amharic) cannot contain numbers.');
      return false;
    }
    if (!formData.birthYear || !formData.deathDate || !formData.number || !formData.image) {
      setError('All fields are required.');
      return false;
    }
    if (isNaN(Number(formData.number))) {
      setError('Number must contain only numeric values.');
      return false;
    }
    if (formData.image) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webm', 'image/webp'];
      if (!validImageTypes.includes(formData.image.type)) {
        setError('Only image files (JPEG, PNG, GIF, JPG, WEBM, WEBP) are allowed.');
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
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96 relative z-60">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Obituary</h3>
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
            <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
            <select
              id="birthYear"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.birthYear}
              onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
            >
              <option value="">Select Year</option>
              {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700 mb-1">Year of Passing</label>
            <select
              id="deathDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.deathDate}
              onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
            >
              <option value="">Select Year</option>
              {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">Number</label>
            <input
              type="number"
              id="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
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

export default AddObituaryModal;
