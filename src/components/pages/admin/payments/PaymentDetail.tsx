import React, { useEffect, useState } from 'react';
import { fetchPaymentById } from '../../../../firebase/firebasePaymentsServices';
import AddPayment from './AddPayment';
import ListPaidPeople from './ListPaidPeople';

interface PaymentDetailProps {
  id: string;
  onClose?: () => void;
}

const PaymentDetail: React.FC<PaymentDetailProps> = ({ id, onClose }) => {
  const [payment, setPayment] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPaymentById(id)
      .then((data) => {
        setPayment(data);
        setError('');
      })
      .catch(() => {
        setError('Failed to load payment data.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-w-[320px] max-w-[90vw] relative">
      {onClose && (
        <button
          className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-red-600 font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      )}
      <h2 className="text-xl font-bold mb-4">Detail For Payment {id}</h2>
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : payment ? (
        <React.Fragment>
          <div className="space-y-2 mb-6">
            <div className="font-semibold text-lg text-blue-700 mb-2 flex items-center gap-4">
              <span>
                Total Members Paid:{' '}
                {Object.values(payment).filter(
                  (v) => typeof v === 'object' && v !== null
                ).length}
              </span>
              <button
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow"
                onClick={() => setShowListModal(true)}
              >
                List
              </button>
            </div>
          </div>
          {showListModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="relative z-10 bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
                <ListPaidPeople paymentId={id} />
                <button
                  className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-red-600 font-bold"
                  onClick={() => setShowListModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          <button
            className="mt-4 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold shadow"
            onClick={() => setShowAddModal(true)}
          >
            Insert Payment
          </button>
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="relative z-10 bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
                <AddPayment paymentId={id} onClose={() => {
                  setShowAddModal(false);
                  // Refetch payment after modal closes to update details
                  setLoading(true);
                  fetchPaymentById(id)
                    .then((data) => {
                      setPayment(data);
                      setError('');
                    })
                    .catch(() => {
                      setError('Failed to load payment data.');
                    })
                    .finally(() => setLoading(false));
                }} />
                <button
                  className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-red-600 font-bold"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </React.Fragment>
      ) : (
        <div className="text-gray-500">No payment data found.</div>
      )}
    </div>
  );
};

export default PaymentDetail;
