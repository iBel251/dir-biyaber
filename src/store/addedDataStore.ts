import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AddedDataState {
  addedData: any[];
  addedDataBackup: any[]; // Backup for restoring full data
  setAddedData: (data: any[]) => void;
  clearAddedData: () => void;
  sortAddedData: (by: 'firstName' | 'membershipId', order: 'asc' | 'desc') => void;
  searchAddedData: (query: string) => void;
  restoreFullData: () => void;
}

const useAddedDataStore = create(
  persist<AddedDataState>(
    (set) => ({
      addedData: [],
      addedDataBackup: [],
      setAddedData: (data) => set({ addedData: data, addedDataBackup: data }),
      clearAddedData: () => set({ addedData: [], addedDataBackup: [] }),
      sortAddedData: (by: 'firstName' | 'membershipId', order: 'asc' | 'desc' = 'asc') => set((state) => {
        const sorted = [...state.addedData].sort((a, b) => {
          if (by === 'membershipId') {
            // Try to parse as numbers, fallback to string compare if not possible
            const numA = parseInt(a[by], 10);
            const numB = parseInt(b[by], 10);
            if (!isNaN(numA) && !isNaN(numB)) {
              return order === 'asc' ? numA - numB : numB - numA;
            }
            // Fallback to string compare if not numbers
            let valA = (a[by] || '').toString().toLowerCase();
            let valB = (b[by] || '').toString().toLowerCase();
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
          } else {
            let valA = (a[by] || '').toString().toLowerCase();
            let valB = (b[by] || '').toString().toLowerCase();
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
          }
        });
        return { addedData: sorted };
      }),
      searchAddedData: (query: string) => set((state) => {
        const lowerQuery = query.trim().toLowerCase();
        if (!lowerQuery) return { addedData: [...state.addedDataBackup] };
        return {
          addedData: state.addedDataBackup.filter((row) =>
            (row.membershipId && row.membershipId.toString().toLowerCase().includes(lowerQuery)) ||
            (row.firstName && row.firstName.toLowerCase().includes(lowerQuery)) ||
            (row.lastName && row.lastName.toLowerCase().includes(lowerQuery)) ||
            (row.email && row.email.toLowerCase().includes(lowerQuery)) ||
            (row.phone && row.phone.toLowerCase().includes(lowerQuery)) ||
            (row.address && row.address.toLowerCase().includes(lowerQuery))
          )
        };
      }),
      restoreFullData: () => set((state) => ({ addedData: [...state.addedDataBackup] })),
    }),
    {
      name: 'added-data-store', // Name of the storage key
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useAddedDataStore;
