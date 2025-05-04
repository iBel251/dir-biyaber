import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OldMembersState {
  members: any[];
  setMembers: (members: any[]) => void;
}

const useOldMembersStore = create(
  persist<OldMembersState>(
    (set) => ({
      members: [],
      setMembers: (members: any[]) => set({ members }),
    }),
    {
      name: 'old-members-store', // Name of the storage key
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

export default useOldMembersStore;