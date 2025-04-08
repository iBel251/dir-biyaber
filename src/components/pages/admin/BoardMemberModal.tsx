import React, { useState, useEffect } from 'react';
import AddBoardMemberModal from './AddBoardMemberModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditBoardMemberModal from './EditBoardMemberModal';
import { addBoardMember, fetchBoardMembers, deleteBoardMember, updateBoardMember } from '../../../firebase/firestoreServices';

const BoardMemberModal: React.FC<{ adminRole: string }> = ({ adminRole }) => {
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const loadBoardMembers = async () => {
      try {
        const members = await fetchBoardMembers();
        console.log("Fetched board members:", members);
        setBoardMembers(members.sort((a, b) => a.position - b.position)); // Sort by position
      } catch (error) {
        console.error("Error loading board members:", error);
      }
    };

    loadBoardMembers();
  }, []);

  useEffect(() => {
    console.log(`Admin role in BoardMemberModal: ${adminRole}`);
    // Additional logic based on adminRole can be added here
  }, [adminRole]);

  const handleDelete = async (): Promise<void> => {
    if (currentItem) {
      try {
        await deleteBoardMember(currentItem.id, currentItem.imageUrl || null);
        setBoardMembers(boardMembers.filter((member) => member.id !== currentItem.id));
        setCurrentItem(null);
      } catch (error) {
        console.error("Error deleting board member:", error);
      }
    }
    setShowDeleteConfirm(false);
  };

  const handleAddMember = async (newMember: any): Promise<void> => {
    try {
      await addBoardMember(newMember);
      const members = await fetchBoardMembers();
      setBoardMembers(members.sort((a, b) => a.position - b.position)); // Sort by position
    } catch (error) {
      console.error("Error adding board member:", error);
    }
  };

  const handleEditMember = async (updatedMember: any): Promise<void> => {
    try {
      await updateBoardMember(updatedMember);
      const members = await fetchBoardMembers();
      setBoardMembers(members.sort((a, b) => a.position - b.position)); // Sort by position
    } catch (error) {
      console.error("Error updating board member:", error);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Board Members</h3>
      {/* Display board members as cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
        {boardMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center text-center"
          >
            {member.imageUrl && (
              <img
                src={member.imageUrl}
                alt={member.nameEn}
                className="w-20 h-20 rounded-full object-cover shadow-md mb-4"
              />
            )}
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">{member.nameEn}</p>
              <p className="text-sm text-gray-500">{member.nameAm}</p>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>
            <div className="flex space-x-3">
              {adminRole === 'superAdmin' && ( // Show only for superAdmin
                <>
                  <button
                    onClick={() => {
                      setCurrentItem(member);
                      setShowEditModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setCurrentItem(member);
                      setShowDeleteConfirm(true);
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {adminRole === 'superAdmin' && ( // Show only for superAdmin
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 !rounded-button"
        >
          Add new member
        </button>
      )}

      {showAddModal && (
        <AddBoardMemberModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddMember}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && currentItem && (
        <EditBoardMemberModal
          member={currentItem}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedMember) => {
            const updatedMemberWithImage = {
              ...updatedMember,
              imageUrl: updatedMember.image || currentItem.imageUrl,
            };
            await handleEditMember(updatedMemberWithImage);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && currentItem && (
        <DeleteConfirmationModal
          itemName={currentItem.nameEn}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default BoardMemberModal;
