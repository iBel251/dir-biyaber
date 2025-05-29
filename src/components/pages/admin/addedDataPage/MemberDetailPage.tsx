import React, { useState } from 'react';
import useAddedDataStore from '../../../../store/addedDataStore';
import { setMemberAddedDataStatus } from '../../../../firebase/firebaseMemberAddedDataServices';

interface MemberDetailPageProps {
  id: string;
  onBack: () => void;
}

const MemberDetailPage: React.FC<MemberDetailPageProps> = ({ id, onBack }) => {
  const { addedDataBackup } = useAddedDataStore();
  const member = addedDataBackup.find(
    (m) => m.id === id || m.docId === id || m.membershipId === id
  );

  const [status, setStatus] = useState(member?.status || '');
  const [saving, setSaving] = useState(false);
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'completed', label: 'Completed' },
    { value: 'error', label: 'Error' },
  ];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    try {
      await setMemberAddedDataStatus(member.id || member.docId || member.membershipId, newStatus);
      // Optionally, show a success message or update local state
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  if (!member) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <button
          className="mb-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          onClick={onBack}
        >
          Back
        </button>
        <h1 className="text-2xl font-bold mb-4">Member Details</h1>
        <div className="bg-white shadow rounded p-4 text-red-600">Member not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <button
        className="mb-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        onClick={onBack}
      >
        Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Member Details</h1>
      <div className="bg-white shadow rounded p-4">
        <div className="mb-4 flex items-center">
          <strong className="text-blue-700">Status:</strong>
          <select
            className="ml-2 border-2 border-blue-500 rounded px-3 py-1 font-semibold text-blue-700 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={status}
            onChange={handleStatusChange}
            disabled={saving}
            style={{ minWidth: 140 }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {saving && <span className="ml-3 text-blue-500 font-semibold animate-pulse">Saving...</span>}
        </div>
        <div className="mb-2"><strong>Membership ID:</strong> {member.membershipId}</div>
        <div className="mb-2"><strong>First Name:</strong> {member.firstName}</div>
        <div className="mb-2"><strong>Last Name:</strong> {member.lastName}</div>
        <div className="mb-2"><strong>Gender:</strong> {member.gender || '-'}</div>
        <div className="mb-2"><strong>Email:</strong> {member.email}</div>
        <div className="mb-2"><strong>Phone:</strong> {member.phone}</div>
        <div className="mb-2"><strong>Apartment:</strong> {member.apartment || '-'}</div>
        <div className="mb-2"><strong>City:</strong> {member.city || '-'}</div>
        <div className="mb-2"><strong>State:</strong> {member.state || '-'}</div>
        <div className="mb-2"><strong>Zip Code:</strong> {member.zipCode || '-'}</div>
        <div className="mb-2"><strong>Address:</strong> {member.address || '-'}</div>
        <div className="mb-2"><strong>Created At:</strong> {member.createdAt ? new Date(member.createdAt).toLocaleString() : '-'}</div>
        {/* Render any other fields if needed */}
      </div>
    </div>
  );
};

export default MemberDetailPage;
