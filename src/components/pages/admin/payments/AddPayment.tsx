import React, { useState } from 'react';
import { fetchMemberById } from '../../../../firebase/firebasePaymentsServices';
import useOldMembersStore from '../../../../store/oldMembersStore';

const AddPayment: React.FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [inputId, setInputId] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [singleAmount, setSingleAmount] = useState('20');
  const [startNumber, setStartNumber] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [addResult, setAddResult] = useState('');
  const [adding, setAdding] = useState(false);

  // Payment details form state
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [method, setMethod] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

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

  // Helper to calculate payment range
  let count = 0;
  let endNumber = '';
  if (
    totalAmount &&
    singleAmount &&
    startNumber &&
    !isNaN(Number(totalAmount)) &&
    !isNaN(Number(singleAmount)) &&
    !isNaN(Number(startNumber)) &&
    Number(singleAmount) > 0
  ) {
    count = Math.floor(Number(totalAmount) / Number(singleAmount));
    endNumber = (Number(startNumber) + count - 1).toString();
  }

  // Validation for minimum amounts
  const totalAmountNum = Number(totalAmount);
  const singleAmountNum = Number(singleAmount);
  const startNumberNum = Number(startNumber);
  const totalAmountError = totalAmount && totalAmountNum < 20 ? 'Total amount must be at least $20.' : '';
  const singleAmountError = singleAmount && singleAmountNum < 20 ? 'Single payment must be at least $20.' : '';
  const startNumberError = startNumber && (startNumberNum < 120 || !Number.isInteger(Number(startNumber))) ? 'Starting payment number must be an integer and at least 120.' : '';

  // Handler to add payments
  const handleAddPayments = async () => {
    setAdding(true);
    setAddResult('');
    try {
      // Build paymentsArray as [{ paymentNumber, data }, ...]
      const paymentsArray: { paymentNumber: string; data: any }[] = [];
      for (let i = 0; i < count; i++) {
        const paymentNumber = (Number(startNumber) + i).toString();
        paymentsArray.push({
          paymentNumber,
          data: {
            amount: Number(singleAmount),
            paidAt: date || new Date().toISOString(),
            place,
            method,
            receiptNumber,
          },
        });
      }
      // Call the batch add function
      // @ts-ignore
      const { addOrUpdateMemberPayments } = await import('../../../../firebase/firebasePaymentsServices');
      await addOrUpdateMemberPayments(result.id, paymentsArray);
      // Refetch member data and update store
      const updatedMember = await fetchMemberById(result.id);
      setResult(updatedMember);
      // Update the member in Zustand store only if updatedMember is not null
      if (updatedMember) {
        useOldMembersStore.getState().setMembers((prevMembers) => {
          return prevMembers.map((m) => m.id === updatedMember.id ? updatedMember : m);
        });
      }
      setAddResult('Payments added successfully!');
      setConfirming(false);
      setTotalAmount('');
      setSingleAmount('');
      setStartNumber('');
      setDate('');
      setPlace('');
      setMethod('');
      setReceiptNumber('');
      setResult(null); // Clear the search result after successful add
      setInputId(''); // Clear the search field
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up
    } catch (e: any) {
      setAddResult(e.message || 'Failed to add payments.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-2 ml-2">
      <button
        className="px-6 py-3 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-lg"
        onClick={() => setShowSearch((v) => !v)}
      >
        Add Payment
      </button>
      {showSearch && (
        <div className="mt-4 max-w-md">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter member ID..."
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              className="border px-4 py-2 rounded w-full text-base"
              disabled={searching}
            />
            <button
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base disabled:bg-gray-400"
              onClick={handleSearch}
              disabled={searching || !inputId.trim()}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <div className="text-red-500 mb-2 text-base">{error}</div>}
          {result && (() => {
            const fields = [
              { label: 'ID', value: result.id },
              { label: 'Full Name', value: result.fullName },
              { label: 'Full Name (Am)', value: result.fullNameAm },
              { label: 'Phone', value: result.phone },
              { label: 'Email', value: result.email },
              { label: 'Status', value: <span className={`font-semibold ${result.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{result.status}</span> },
            ];
            return (
              <div className="bg-white rounded-lg shadow p-4 mt-2 border border-gray-200 flex flex-col gap-2 max-w-md mx-auto">
                <div className="mb-2 font-semibold text-lg text-blue-700 flex items-center gap-2">
                  <svg className="inline-block h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Member Found
                </div>
                <div className="text-base">
                  {fields.map((item, idx) => (
                    <div key={item.label} className={`flex items-center px-2 py-1 ${idx % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                      <div className="font-medium text-gray-600 w-36 flex-shrink-0">{item.label}:</div>
                      <div className="text-gray-900 ml-2">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {result && result.status === 'active' && (
            <div className="bg-gray-50 rounded p-4 mt-2 border">
              <div className="mb-2 font-semibold text-lg">Payment Details</div>
              <div className="flex flex-col gap-2 mb-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-500 text-base">$</span>
                  <input
                    type="number"
                    placeholder="Total amount to pay"
                    className="border px-6 py-2 rounded w-full text-base"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    disabled={adding || confirming}
                    min="20"
                  />
                </div>
                {totalAmountError && <div className="text-red-500 text-xs ml-1">{totalAmountError}</div>}
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-500 text-base">$</span>
                  <input
                    type="number"
                    placeholder="Single payment amount"
                    className="border px-6 py-2 rounded w-full text-base"
                    value={singleAmount}
                    onChange={e => setSingleAmount(e.target.value)}
                    disabled={adding || confirming}
                    min="20"
                  />
                </div>
                {singleAmountError && <div className="text-red-500 text-xs ml-1">{singleAmountError}</div>}
                <input
                  type="number"
                  placeholder="Starting payment number"
                  className="border px-3 py-2 rounded"
                  value={startNumber}
                  onChange={e => {
                    // Only allow integers
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) setStartNumber(val);
                  }}
                  disabled={adding || confirming}
                  min="120"
                  step="1"
                />
                {startNumberError && <div className="text-red-500 text-xs ml-1">{startNumberError}</div>}
              </div>
              {count > 0 && (
                <div className="mb-2 text-blue-700 font-medium">
                  This will add payments from <b>{startNumber}</b> to <b>{endNumber}</b> (total: {count})
                </div>
              )}
              {count > 0 && !totalAmountError && !singleAmountError && !startNumberError && !confirming && (
                <button
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2"
                  onClick={() => setConfirming(true)}
                  disabled={adding}
                >
                  Proceed
                </button>
              )}
              {confirming && (
                <div className="mt-2">
                  <form
                    className="flex flex-col gap-2 mb-2"
                    onSubmit={e => {
                      e.preventDefault();
                      handleAddPayments();
                    }}
                  >
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-0.5">Date</label>
                        <input
                          type="date"
                          className="border px-3 py-2 rounded w-full text-base"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          required
                          disabled={adding}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-0.5">Place</label>
                        <input
                          type="text"
                          className="border px-3 py-2 rounded w-full text-base"
                          value={place}
                          onChange={e => setPlace(e.target.value)}
                          required
                          disabled={adding}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-0.5">Method</label>
                        <select
                          className="border px-3 py-2 rounded w-full text-base"
                          value={method}
                          onChange={e => setMethod(e.target.value)}
                          required
                          disabled={adding}
                        >
                          <option value="">Select method</option>
                          <option value="cash">Cash</option>
                          <option value="bank">Bank</option>
                          <option value="zelle">Zelle</option>
                          <option value="check">Check</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-0.5">Receipt Number</label>
                        <input
                          type="text"
                          className="border px-3 py-2 rounded w-full text-base"
                          value={receiptNumber}
                          onChange={e => setReceiptNumber(e.target.value)}
                          required
                          disabled={adding}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold mr-2"
                        disabled={adding}
                      >
                        {adding ? 'Adding...' : 'Add Payments'}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                        onClick={() => setConfirming(false)}
                        disabled={adding}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {addResult && <div className="mt-2 text-center text-base text-green-700">{addResult}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddPayment;
