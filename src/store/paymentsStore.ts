import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PaymentsState {
  payments: Record<string, any>[];
  setPayments: (payments: Record<string, any>[] | ((prev: Record<string, any>[]) => Record<string, any>[])) => void;
  addPayment: (payment: Record<string, any>) => void;
  updatePayment: (id: string, updates: Partial<Record<string, any>>) => void;
  removePayment: (id: string) => void;
}

const usePaymentsStore = create(
  persist<PaymentsState>(
    (set) => ({
      payments: [],
      setPayments: (paymentsOrUpdater) => {
        if (typeof paymentsOrUpdater === 'function') {
          set((state) => ({ payments: paymentsOrUpdater(state.payments) }));
        } else {
          set({ payments: paymentsOrUpdater });
        }
      },
      addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
      updatePayment: (id, updates) => set((state) => ({
        payments: state.payments.map((p) => p.id === id ? { ...p, ...updates } : p)
      })),
      removePayment: (id) => set((state) => ({
        payments: state.payments.filter((p) => p.id !== id)
      })),
    }),
    {
      name: 'payments-store',
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

export default usePaymentsStore;
