import React, { useState } from 'react';
import { deleteMember } from '../../../../firebase/firebaseMembersServices';
import useOldMembersStore from '../../../../store/oldMembersStore';

interface DeleteMemberModalProps {
  memberId: string;
  onClose: () => void;
  onDetailClose: () => void; // Add a prop to close the detail modal
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({ memberId, onClose, onDetailClose }) => {
  const { setMembers } = useOldMembersStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true); // Set loading state to true
      await deleteMember(memberId);
      console.log(`Member with ID ${memberId} deleted successfully.`);

      // Update the Zustand store to remove the deleted member
      setMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId));

      onClose(); // Close the delete modal
      onDetailClose(); // Close the detail modal
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      setIsDeleting(false); // Reset loading state
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
        <p>Are you sure you want to delete this member?</p>
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 mr-2"
            onClick={onClose}
            disabled={isDeleting} // Disable button while deleting
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded ${isDeleting ? 'bg-gray-400 text-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
            onClick={handleDelete}
            disabled={isDeleting} // Disable button while deleting
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMemberModal;
