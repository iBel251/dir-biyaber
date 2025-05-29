import React, { useState } from 'react';
import { addMember } from '../../../../firebase/firebaseMembersServices';
import useOldMembersStore from '../../../../store/oldMembersStore';

interface AddMemberModalProps {
  onClose: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose }) => {
  const addMemberToStore = useOldMembersStore((state: { addMember: (member: any) => void }) => state.addMember);

  const [form, setForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    firstNameAmharic: '',
    lastNameAmharic: '',
    dateOfBirth: '',
    addressLine1: '', // New: main street address
    apartment: '',    // Apartment/unit/suite
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formatPhoneNumber = (phone: string): string => {
    // Format phone number to XXX-XXX-XXXX
    const cleaned = phone.replace(/\D/g, ''); // Remove non-numeric characters
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formattedPhone = formatPhoneNumber(form.phone); // Format the phone number
      // Compose address string for storage
      let address = form.addressLine1;
      if (form.apartment) address += `, ${form.apartment}`;
      address += `, ${form.city}, ${form.state} ${form.zipCode}`;
      const newMember = {
        ...form,
        phone: formattedPhone,
        payments: [],
        // Save each address field separately
        addressLine1: form.addressLine1,
        apartment: form.apartment,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        // Optionally, you can remove the 'address' field if not needed
      };
      await addMember(newMember);
      addMemberToStore(newMember); // Update Zustand store
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded shadow-lg p-8 w-full max-w-3xl relative"> {/* Increased padding and max width */}
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-6">Add Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input name="id" value={form.id} onChange={handleChange} required placeholder="ID (unique)" className="border p-2 flex-1" />
            <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required placeholder="Date of Birth" type="date" className="border p-2 flex-1" />
          </div>
          <div className="flex gap-2">
            <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="First Name (EN)" className="border p-2 flex-1" />
            <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Last Name (EN)" className="border p-2 flex-1" />
          </div>
          <div className="flex gap-2">
            <input name="firstNameAmharic" value={form.firstNameAmharic} onChange={handleChange} required placeholder="First Name (አማ)" className="border p-2 flex-1" />
            <input name="lastNameAmharic" value={form.lastNameAmharic} onChange={handleChange} required placeholder="Last Name (አማ)" className="border p-2 flex-1" />
          </div>
          <div className="flex gap-2">
            <input name="addressLine1" value={form.addressLine1} onChange={handleChange} required placeholder="Street Address" className="border p-2 flex-1" />
            <input name="apartment" value={form.apartment} onChange={handleChange} placeholder="Apt / Suite" className="border p-2 flex-1" />
          </div>
          <div className="flex gap-2">
            <input name="city" value={form.city} onChange={handleChange} required placeholder="City" className="border p-2 flex-1" />
            <input name="state" value={form.state} onChange={handleChange} required placeholder="State" className="border p-2 flex-1" />
            <input name="zipCode" value={form.zipCode} onChange={handleChange} required placeholder="Zip Code" className="border p-2 flex-1" />
          </div>
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
