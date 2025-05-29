import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OldMembersState {
  members: any[];
  membersBackup: any[]; // Backup for filtering
  setMembers: (members: any[] | ((prevMembers: any[]) => any[])) => void;
  addMember: (member: any) => void;
  sortMembersAZ: () => void;
  sortMembersZA: () => void;
  filterMembersByStatus: (status: string) => void;
  sortMembersById: () => void;
  changeMemberStatus: (id: string, status: string) => void;
}

const useOldMembersStore = create(
  persist<OldMembersState>(
    (set) => ({
      members: [],
      membersBackup: [],
      setMembers: (membersOrUpdater) => {
        if (typeof membersOrUpdater === 'function') {
          set((state) => {
            const newMembers = membersOrUpdater(state.members);
            return { members: newMembers, membersBackup: newMembers };
          });
        } else {
          set({ members: membersOrUpdater, membersBackup: membersOrUpdater });
        }
      },
      addMember: (member) => {
        const fullName = `${member.firstName} ${member.lastName}`;
        const fullNameAm = `${member.firstNameAmharic} ${member.lastNameAmharic}`;
        set((state) => {
          const updatedMembers = [
            ...state.members,
            { ...member, fullName, fullNameAm },
          ];
          return { members: updatedMembers, membersBackup: updatedMembers };
        });
      },
      sortMembersAZ: () => set((state) => ({
        members: [...state.members].sort((a, b) => {
          // Normalize and handle empty, symbol, number, and letter names robustly
          const rawA = (a.fullName || '').trim();
          const rawB = (b.fullName || '').trim();
          if (!rawA && !rawB) return 0;
          if (!rawA) return 1; // Empty names last
          if (!rawB) return -1;
          // Remove diacritics and non-alphanumeric (keep letters and numbers)
          const nameA = rawA.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const nameB = rawB.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

          // If both names start with a letter, compare as normal
          const isLetterA = /^[a-zA-Z]/.test(rawA);
          const isLetterB = /^[a-zA-Z]/.test(rawB);
          if (isLetterA && isLetterB) return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
          // If only one starts with a letter, put letters before symbols/numbers
          if (isLetterA) return -1;
          if (isLetterB) return 1;
          // If both are not letters, compare as normal
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        }),
      })),
      sortMembersZA: () => set((state) => ({
        members: [...state.members].sort((a, b) => {
          const nameA = (a.fullName || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const nameB = (b.fullName || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          // Empty names first
          if (!nameA && !nameB) return 0;
          if (!nameA) return -1;
          if (!nameB) return 1;
          const isLetterA = /^[a-zA-Z]/.test(nameA);
          const isLetterB = /^[a-zA-Z]/.test(nameB);
          // Both symbols
          if (!isLetterA && !isLetterB) return nameB.localeCompare(nameA);
          // Symbol before letter
          if (!isLetterA) return -1;
          if (!isLetterB) return 1;
          // Both letters
          return nameB.toLowerCase().localeCompare(nameA.toLowerCase());
        }),
      })),
      sortMembersById: () => set((state) => {
        // Always sort from the backup (full data) to avoid sorting filtered/partial data
        const source = state.membersBackup && state.membersBackup.length > 0 ? [...state.membersBackup] : [...state.members];
        const sorted = source.sort((a, b) => {
          const idA = a.id;
          const idB = b.id;
          // Only treat as number if the entire string is a number
          const isNumA = typeof idA === 'string' && /^\d+$/.test(idA);
          const isNumB = typeof idB === 'string' && /^\d+$/.test(idB);
          if (isNumA && isNumB) return Number(idA) - Number(idB);
          if (isNumA) return -1; // Numeric IDs come first
          if (isNumB) return 1;
          // Both are non-numeric, sort alphabetically (case-insensitive)
          if (typeof idA === 'string' && typeof idB === 'string') return idA.localeCompare(idB, undefined, { sensitivity: 'base' });
          return 0;
        });
        return { members: sorted, membersBackup: sorted };
      }),
      filterMembersByStatus: (status: string) => set((state) => {
        if (!status || status === 'All') {
          return { members: state.membersBackup ? [...state.membersBackup] : [...state.members] };
        }
        // Save backup if not already saved
        if (!state.membersBackup) {
          state.membersBackup = [...state.members];
        }
        return {
          members: (state.membersBackup || state.members).filter((member) =>
            (member.status || '').toLowerCase() === status.toLowerCase()
          )
        };
      }),
      changeMemberStatus: (id, status) => set((state) => {
        const update = (arr: any[]) => arr.map((m) => m.id === id ? { ...m, status } : m);
        return {
          members: update(state.members),
          membersBackup: update(state.membersBackup),
        };
      }),
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