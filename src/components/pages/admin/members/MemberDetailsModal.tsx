import React from 'react';

interface MemberDetailsModalProps {
  member: {
    id: string;
    fullName: string;
    fullNameAm: string;
    phone: string;
  } | null;
  onClose: () => void;
}

const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Member Details</h2>
        <p><strong>ID:</strong> {member.id}</p>
        <p><strong>Full Name:</strong> {member.fullName}</p>
        <p><strong>Full Name (Amharic):</strong> {member.fullNameAm}</p>
        <p><strong>Phone:</strong> {member.phone}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MemberDetailsModal;