import React, { useState, useEffect } from 'react';
import { updateMember } from '../../../../firebase/firebaseMembersServices';
import useOldMembersStore from '../../../../store/oldMembersStore';
import DeleteMemberModal from './DeleteMemberModal';
import MemberPaymentsSection from './MemberPaymentsSection';

interface MemberDetailsModalProps {
  member: Record<string, any> | null;
  onClose: () => void;
  onSave?: (updatedMember: Record<string, any>) => void; // Made optional
  adminRole?: string;
}

const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({ member, onClose, adminRole }) => {
  const { setMembers } = useOldMembersStore();
  const defaultMemberState: Record<string, any> = member ? { ...member } : {};
  const [editableMemberState, setEditableMemberState] = useState<Record<string, any>>(defaultMemberState);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Prevent background scrolling when the modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore background scrolling when the modal is closed
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!member) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableMemberState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true); // Set loading state to true
      if (editableMemberState.id) {
        await updateMember(editableMemberState.id, editableMemberState);
        console.log('Member updated successfully');

        // Update the Zustand store with the updated member
        setMembers((prevMembers: Record<string, any>[]) =>
          prevMembers.map((m: Record<string, any>) =>
            m.id === editableMemberState.id ? { ...m, ...editableMemberState } : m
          )
        );
      }
      onClose();
    } catch (error) {
      console.error('Error updating member:', error);
    } finally {
      setIsSaving(false); // Reset loading state
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[900px] max-h-[90vh] overflow-y-auto flex gap-8 relative">
        {/* X button in top right, inside modal, always visible */}
        <button
          className="absolute top-4 right-4 text-gray-700 hover:text-red-600 text-4xl font-extrabold focus:outline-none rounded-full shadow-lg w-12 h-12 flex items-center justify-center border-2 border-gray-300 hover:border-red-500 transition-all duration-150 z-20"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        {/* Left: Member Details */}
        <div className="flex-1 min-w-0 max-w-[50%] relative">
          <h2 className="text-xl font-bold mb-4">Edit Member Details</h2>
          <label className="block mb-2">
            <strong>ID:</strong>
            <input
              type="text"
              name="id"
              value={editableMemberState.id || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
              disabled // Make the ID field non-editable
            />
          </label>
          <label className="block mb-2">
            <strong>Full Name:</strong>
            <input
              type="text"
              name="fullName"
              value={editableMemberState.fullName || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>Full Name (Amharic):</strong>
            <input
              type="text"
              name="fullNameAm"
              value={editableMemberState.fullNameAm || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>Phone:</strong>
            <input
              type="text"
              name="phone"
              value={editableMemberState.phone || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>Status:</strong>
            <select
              name="status"
              value={editableMemberState.status || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="warning">Warning</option>
              <option value="stopped">Stopped</option>
              <option value="deceased">Deceased</option>
            </select>
          </label>
          <label className="block mb-2">
            <strong>Email:</strong>
            <input
              type="email"
              name="email"
              value={editableMemberState.email || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>Street Address:</strong>
            <input
              type="text"
              name="addressLine1"
              value={editableMemberState.addressLine1 || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>Apartment/Suite:</strong>
            <input
              type="text"
              name="apartment"
              value={editableMemberState.apartment || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>City:</strong>
            <input
              type="text"
              name="city"
              value={editableMemberState.city || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>State:</strong>
            <input
              type="text"
              name="state"
              value={editableMemberState.state || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="block mb-2">
            <strong>Zip Code:</strong>
            <input
              type="text"
              name="zipCode"
              value={editableMemberState.zipCode || ''}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          {/* Move Save/Delete buttons to the bottom */}
          <div className="flex justify-between mt-8">
            <button
              className={`px-4 py-2 rounded ${adminRole !== 'superAdmin' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
              onClick={() => adminRole === 'superAdmin' && setShowDeleteModal(true)}
              disabled={adminRole !== 'superAdmin'}
            >
              Delete Member
            </button>
            <button
              className={`px-4 py-2 rounded ${isSaving || adminRole !== 'superAdmin' ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              onClick={adminRole === 'superAdmin' ? handleSave : undefined}
              disabled={isSaving || adminRole !== 'superAdmin'}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        {/* Right: Payments & Additional Fields */}
        <MemberPaymentsSection member={member} />
      </div>
      {showDeleteModal && (
        <DeleteMemberModal
          memberId={editableMemberState.id}
          onClose={() => setShowDeleteModal(false)}
          onDetailClose={onClose}
        />
      )}
    </div>
  );
};

export default MemberDetailsModal;