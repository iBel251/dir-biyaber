import { create } from 'zustand'

interface StoreState {
    bears: number;
    items: string[]; // New state property
}

interface StoreActions {
    increasePopulation: () => void;
    removeAllBears: () => void;
    updateBears: (newBears: number) => void;
    addItem: (item: string) => void; // New action
    removeItem: (item: string) => void; // New action
}

const useStore = create<StoreState & StoreActions>((set) => ({
    bears: 0,
    items: [], // Initialize the array
    increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
    updateBears: (newBears) => set({ bears: newBears }),
    addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })), // Add item to array
    removeItem: (item) =>
        set((state) => ({
            items: state.items.filter((i) => i !== item), // Remove item from array
        })),
}));
