import React, { useState } from 'react';
import { fetchMemberById, insertMemberPaymentToPaymentDoc, fetchPaymentById } from '../../../../firebase/firebasePaymentsServices';
import usePaymentsStore from '../../../../store/paymentsStore';

// Accept paymentId as a prop
interface AddPaymentProps {
  paymentId: string;
  onClose?: () => void;
}

const AddPayment: React.FC<AddPaymentProps> = ({ paymentId, onClose }) => {
  const [inputId, setInputId] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');

  const [paymentNumber, setPaymentNumber] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [method, setMethod] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [remark, setRemark] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);
  const [addPaymentError, setAddPaymentError] = useState('');
  const [addPaymentSuccess, setAddPaymentSuccess] = useState('');

  const setPayments = usePaymentsStore((state) => state.setPayments);

  const handleSearch = async () => {
    setError('');
    setResult(null);
    if (!inputId.trim()) {
      setError('Please enter a member ID.');
      return;
    }
    setSearching(true);
    try {
      const member = await fetchMemberById(inputId.trim());
      if (member) {
        setResult(member);
      } else {
        setError('No member found with that ID.');
      }
    } catch (e) {
      setError('Error fetching member.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPaymentError('');
    setAddPaymentSuccess('');
    setAddingPayment(true);
    try {
      if (!result?.id) throw new Error('No member selected.');
      if (!paymentId) throw new Error('No payment ID provided.');
      const paymentData = {
        paymentNumber,
        date,
        place,
        method,
        receiptNumber,
        remark,
      };
      await insertMemberPaymentToPaymentDoc(paymentId, result.id, paymentData);
      // Refetch payment and update store
      const updatedPayment = await fetchPaymentById(paymentId);
      if (updatedPayment) {
        setPayments((prev) => {
          const idx = prev.findIndex((p) => p.id === paymentId);
          if (idx !== -1) {
            const newArr = [...prev];
            newArr[idx] = updatedPayment;
            return newArr;
          } else {
            return [...prev, updatedPayment];
          }
        });
      }
      setAddPaymentSuccess('Payment added successfully!');
      setPaymentNumber('');
      setDate('');
      setPlace('');
      setMethod('');
      setReceiptNumber('');
      setRemark('');
      if (typeof onClose === 'function') onClose();
    } catch (err: any) {
      setAddPaymentError(err.message || 'Failed to add payment.');
    } finally {
      setAddingPayment(false);
    }
  };

  // Set paymentNumber to paymentId and make it non-editable
  React.useEffect(() => {
    setPaymentNumber(paymentId);
  }, [paymentId]);

  return (
    <div className="max-w-4xl w-full mx-auto p-10 bg-white rounded-lg shadow-lg mt-8 overflow-y-auto" style={{ minHeight: '400px', maxHeight: '90vh' }}>
      <h2 className="text-2xl font-bold mb-8 text-center">Search Member by ID</h2>
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Enter member ID..."
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          className="border px-4 py-3 rounded w-full text-lg"
          disabled={searching}
        />
        <button
          className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg disabled:bg-gray-400"
          onClick={handleSearch}
          disabled={searching || !inputId.trim()}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <div className="text-red-500 mb-4 text-center text-lg">{error}</div>}
      {result && (
        <div className="flex flex-row gap-8 bg-gray-50 rounded p-8 mt-2">
          {/* Member details on the left */}
          <div className="flex-1 min-w-[250px] max-w-[350px] border-r pr-8">
            <h3 className="font-semibold mb-4 text-lg">Member Found:</h3>
            <div className="flex flex-col gap-2 text-base">
              {result.fullNameAm && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">ስም:</span>
                  <span className="text-gray-900">{result.fullNameAm}</span>
                </div>
              )}
              {result.fullName && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-900">{result.fullName}</span>
                </div>
              )}
              {result.phone && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="text-gray-900">{result.phone}</span>
                </div>
              )}
              {result.email && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-900">{result.email}</span>
                </div>
              )}
              {result.status && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="text-gray-900">{result.status}</span>
                </div>
              )}
            </div>
          </div>
          {/* Payment form or inactive message on the right */}
          <div className="flex-1 pl-8">
            {result.status !== 'active' ? (
              <div className="text-red-600 font-semibold text-lg flex items-center h-full">Member is not active. Please set this member as active before adding payment data.</div>
            ) : (
              <form className="flex flex-col gap-2" onSubmit={handleAddPayment}>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Payment Number</label>
                    <input type="text" className="border px-3 py-2 rounded w-full text-base bg-gray-100" value={paymentNumber} disabled readOnly />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Date</label>
                    <input type="date" className="border px-3 py-2 rounded w-full text-base" value={date} onChange={e => setDate(e.target.value)} required />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Place</label>
                    <input type="text" className="border px-3 py-2 rounded w-full text-base" value={place} onChange={e => setPlace(e.target.value)} required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Method</label>
                    <select className="border px-3 py-2 rounded w-full text-base" value={method} onChange={e => setMethod(e.target.value)} required>
                      <option value="">Select method</option>
                      <option value="zelle">Zelle</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="deposit">Deposit</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Receipt Number</label>
                    <input type="text" className="border px-3 py-2 rounded w-full text-base" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Remark</label>
                    <input type="text" className="border px-3 py-2 rounded w-full text-base" value={remark} onChange={e => setRemark(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="mt-1 px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-base disabled:bg-gray-400" disabled={addingPayment}>
                  {addingPayment ? 'Adding...' : 'Add Payment'}
                </button>
                {addPaymentError && <div className="text-red-500 mt-1 text-center text-sm">{addPaymentError}</div>}
                {addPaymentSuccess && <div className="text-green-600 mt-1 text-center text-sm">{addPaymentSuccess}</div>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPayment;
