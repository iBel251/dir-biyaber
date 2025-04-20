import React, { useState } from 'react';
import { addMember } from '../../../../firebase/firebaseMembersServices';

interface AddMemberModalProps {
  onClose: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    firstNameAmharic: '',
    lastNameAmharic: '',
    dateOfBirth: '',
    address: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addMember({ ...form, payments: [] });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Add Member</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input name="id" value={form.id} onChange={handleChange} required placeholder="ID (unique)" className="border p-2 flex-1" />
            <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required placeholder="Date of Birth" type="date" className="border p-2 flex-1" />
          </div>
          <div className="flex gap-2">
            <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="First Name (EN)" className="border p-2 flex-1" />
            <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Last Name (EN)" className="border p-2 flex-1" />
          </div>
          <div className="flex gap-2">
            <input name="firstNameAmharic" value={form.firstNameAmharic} onChange={handleChange} required placeholder="First Name (AM)" className="border p-2 flex-1" />
            <input name="lastNameAmharic" value={form.lastNameAmharic} onChange={handleChange} required placeholder="Last Name (AM)" className="border p-2 flex-1" />
          </div>
          <input name="address" value={form.address} onChange={handleChange} required placeholder="Address" className="border p-2 w-full" />
          <input name="email" value={form.email} onChange={handleChange} required placeholder="Email" type="email" className="border p-2 w-full" />
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" className="border p-2 w-full" />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
