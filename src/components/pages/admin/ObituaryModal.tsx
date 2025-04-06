import React, { useState, useEffect } from 'react';
import { fetchObituaries, addObituary, deleteObituary } from '../../../firebase/firestoreServices';
import AddObituaryModal from './AddObituaryModal';
import ObituaryDeleteConfirmationModal from './ObituaryDeleteConfirmationModal'

const ObituaryModal: React.FC = () => {
  const [obituaries, setObituaries] = useState<
    { id: string; nameEn: string; nameAm: string; birthYear: string; deathDate: string; number: string; imageUrl?: string }[]
  >([]);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchObituaries();
        const formattedData = data.map((item: any) => ({
          id: item.id,
          nameEn: item.nameEn || '',
          nameAm: item.nameAm || '',
          birthYear: item.birthYear || '',
          deathDate: item.deathDate || '',
          number: item.number || '',
          imageUrl: item.imageUrl || '',
        }));
        setObituaries(formattedData);
      } catch (error) {
        console.error('Error fetching obituaries:', error);
      }
    };
    fetchData();
  }, []);

  const handleAddObituary = async (newObituary: { nameEn: string; nameAm: string; birthYear: string; deathDate: string; number: string; image: File | null }) => {
    try {
      await addObituary(newObituary);
      setObituaries((prev) => [...prev, { id: Date.now().toString(), ...newObituary, imageUrl: '' }]); // Temporary ID and imageUrl for UI
    } catch (error) {
      console.error('Error adding obituary:', error);
    }
  };

  const handleDelete = async () => {
    if (currentItem) {
      try {
        await deleteObituary(currentItem.id, currentItem.imageUrl);
        setObituaries((prev) => prev.filter((o) => o.id !== currentItem.id));
      } catch (error) {
        console.error('Error deleting obituary:', error);
      }
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Obituaries</h3>
      <button
        onClick={() => setShowAddModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mb-4"
      >
        Add Obituary
      </button>

      {/* Display obituaries in card mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {obituaries.map((obit) => (
          <div key={obit.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            {obit.imageUrl && (
              <img src={obit.imageUrl} alt={obit.nameEn} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h4 className="text-lg font-medium text-gray-900">{obit.nameEn}</h4>
              <p className="text-sm text-gray-700">{obit.nameAm}</p>
              <p className="text-sm text-gray-500">
                {obit.birthYear} - {obit.deathDate}
              </p>
              <p className="text-sm text-gray-500">Number: {obit.number}</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setCurrentItem(obit);
                    setShowDeleteConfirm(true);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Obituary Modal */}
      {showAddModal && (
        <AddObituaryModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddObituary}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && currentItem && (
        <ObituaryDeleteConfirmationModal
          itemName={currentItem.nameEn}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default ObituaryModal;
