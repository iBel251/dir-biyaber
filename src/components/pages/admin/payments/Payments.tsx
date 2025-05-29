import React, { useEffect, useState } from 'react';
import usePaymentsStore from '../../../../store/paymentsStore';
import { fetchAllPayments, addPaymentWithId } from '../../../../firebase/firebasePaymentsServices';
import PaymentDetail from './PaymentDetail';

const Payments: React.FC = () => {
  const setPayments = usePaymentsStore((state) => state.setPayments);
  const payments = usePaymentsStore((state) => state.payments);

  const [showAdd, setShowAdd] = useState(false);
  const [newPaymentId, setNewPaymentId] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all payments from Firestore and store in Zustand
    fetchAllPayments().then((data) => {
      setPayments(data); // Store the objects as-is, no normalization
    });
  }, [setPayments]);

  const handleAddPayment = async () => {
    setError('');
    if (!newPaymentId || isNaN(Number(newPaymentId))) {
      setError('Please enter a valid payment number.');
      return;
    }
    setAdding(true);
    try {
      await addPaymentWithId(newPaymentId, {}); // Pass empty data object
      // Refetch payments after adding
      const updated = await fetchAllPayments();
      setPayments(updated);
      setShowAdd(false);
      setNewPaymentId('');
    } catch (e: any) {
      if (e instanceof Error && e.message.includes('already exists')) {
        setError('A payment with this ID already exists.');
      } else {
        setError('Failed to add payment.');
      }
    } finally {
      setAdding(false);
    }
  };

  if (selectedPaymentId) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button
          className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
          onClick={() => setSelectedPaymentId(null)}
        >
          &larr; Back to Payments List
        </button>
        <div className="bg-white rounded shadow p-6 w-full">
          {/* Render PaymentDetail inline, not as modal */}
          <PaymentDetail id={selectedPaymentId} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowAdd((v) => !v)}
        >
          {showAdd ? 'Cancel' : 'Add Payment'}
        </button>
      </div>
      {showAdd && (
        <div className="mb-6 flex items-center gap-4">
          <input
            type="number"
            placeholder="Payment number (ID)"
            value={newPaymentId}
            onChange={e => setNewPaymentId(e.target.value)}
            className="border px-3 py-2 rounded w-48"
            disabled={adding}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            onClick={handleAddPayment}
            disabled={adding}
          >
            {adding ? 'Adding...' : 'Save'}
          </button>
          {error && <span className="text-red-500 ml-2">{error}</span>}
        </div>
      )}
      <div className="bg-white rounded shadow p-6 min-h-[300px] w-full">
        <h2 className="text-lg font-semibold mb-4">Payment List</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500">No payments found.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {payments.map((payment) => (
              <button
                key={payment.id}
                className="px-6 py-3 rounded-lg bg-blue-100 hover:bg-blue-300 text-blue-900 font-semibold shadow transition-colors duration-150 cursor-pointer border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setSelectedPaymentId(payment.id)}
                title={`View payment ${payment.id}`}
              >
                {payment.id}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
