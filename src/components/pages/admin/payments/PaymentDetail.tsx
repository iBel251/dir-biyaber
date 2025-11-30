import React, { useEffect, useState } from 'react';
import { fetchMemberById, removeMemberPaymentByNumber } from '../../../../firebase/firebasePaymentsServices';
import useOldMembersStore from '../../../../store/oldMembersStore';

interface PaymentDetailProps {
  id: string;
  onClose?: () => void;
}

const PaymentDetail: React.FC<PaymentDetailProps> = ({ id, onClose }) => {
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const setMembers = useOldMembersStore((state) => state.setMembers);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMemberById(id);
        setMember(data);
        console.log('Fetched member:', data);
      } catch (err: any) {
        setError('Failed to fetch member data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Remove payment handler
  const handleRemovePayment = async (paymentNumber: string) => {
    setRemoving(paymentNumber);
    try {
      await removeMemberPaymentByNumber(id, paymentNumber);
      // Refetch member data after removal
      const data = await fetchMemberById(id);
      setMember(data);
      setExpanded(null);
      setConfirmRemove(null);
      // Update the member in the Zustand store, only if data and data.payments exist
      setMembers((prevMembers: any[]) =>
        prevMembers.map((m) =>
          m.id === id && data && 'payments' in data
            ? { ...m, payments: (data as any).payments }
            : m
        )
      );
    } catch (err) {
      alert('Failed to remove payment.');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!member) return <div>No member found.</div>;

  // Prepare payments array (handle both array and object forms)
  let paymentsArr: any[] = [];
  if (Array.isArray(member?.payments)) {
    paymentsArr = member.payments;
  } else if (member?.payments && typeof member.payments === 'object') {
    paymentsArr = Object.entries(member.payments).map(([paymentNumber, data]) => ({ paymentNumber, data }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" style={{ overflowY: 'auto' }}>
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[600px] max-w-4xl w-full relative overflow-x-auto max-h-[90vh] border-2 border-blue-400">
        <button
          className="sticky top-2 right-2 float-right text-white bg-red-600 hover:bg-red-700 text-4xl z-30 border-4 border-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center transition-all duration-200 focus:ring-4 focus:ring-red-300 outline-none"
          style={{ position: 'sticky', top: 0, right: 0 }}
          onClick={onClose || (() => {})}
          aria-label="Close"
          tabIndex={0}
        >
          &times;
        </button>
        <h2 className="text-2xl font-extrabold mb-6 text-blue-700 text-center tracking-wide">Member Payment Detail</h2>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div><span className="font-bold text-blue-900">ID:</span> <span className="text-gray-800">{member.id}</span></div>
          <div><span className="font-bold text-blue-900">Full Name:</span> <span className="text-gray-800">{member.fullName}</span></div>
          <div><span className="font-bold text-blue-900">Full Name (Am):</span> <span className="text-gray-800">{member.fullNameAm}</span></div>
          <div><span className="font-bold text-blue-900">Phone:</span> <span className="text-gray-800">{member.phone}</span></div>
          <div><span className="font-bold text-blue-900">Email:</span> <span className="text-gray-800">{member.email}</span></div>
        </div>
        <div>
          <h3 className="font-semibold text-xl mb-3 text-blue-700">Payments</h3>
          {paymentsArr.length === 0 && <div className="text-gray-500">No payments found.</div>}
          <ul className="divide-y divide-blue-100">
            {paymentsArr.map((p, idx) => (
              <li key={p.paymentNumber || idx} className="py-2">
                <button
                  className={`w-full text-left flex items-center justify-between px-4 py-2 rounded-lg font-semibold transition-colors duration-150 ${expanded === (p.paymentNumber || idx) ? 'bg-blue-100 text-blue-900' : 'bg-blue-50 hover:bg-blue-100 text-blue-800'}`}
                  onClick={() => setExpanded(expanded === (p.paymentNumber || idx) ? null : (p.paymentNumber || idx))}
                >
                  <span className="text-base">Payment <span className="font-bold">#{p.paymentNumber}</span></span>
                  <span className="ml-2 text-lg">{expanded === (p.paymentNumber || idx) ? '▲' : '▼'}</span>
                </button>
                {expanded === (p.paymentNumber || idx) && (
                  <div className="bg-blue-50 p-4 mt-2 rounded-lg border border-blue-200 text-sm max-h-[40vh] overflow-y-auto animate-fade-in">
                    {p.data && typeof p.data === 'object' ? (
                      <table className="w-full text-left">
                        <tbody>
                          {Object.keys(p.data)
                            .sort((a, b) => a.localeCompare(b))
                            .map((k) => (
                              <tr key={k}>
                                <td className="pr-1 font-semibold text-blue-900 align-top whitespace-nowrap align-top" style={{width: '1%', whiteSpace: 'nowrap', verticalAlign: 'top'}}>{k}:</td>
                                <td className="break-all text-gray-800 align-top" style={{width: '99%', verticalAlign: 'top'}}>{String(p.data[k])}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div>{JSON.stringify(p.data)}</div>
                    )}
                    <div className="mt-4 flex justify-end">
                      {confirmRemove === (p.paymentNumber || idx) ? (
                        <>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mr-2 font-bold disabled:opacity-60"
                            onClick={() => handleRemovePayment(p.paymentNumber)}
                            disabled={removing === (p.paymentNumber || idx)}
                          >
                            {removing === (p.paymentNumber || idx) ? 'Removing...' : 'Confirm Remove'}
                          </button>
                          <button
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-bold"
                            onClick={() => setConfirmRemove(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-bold"
                          onClick={() => setConfirmRemove(p.paymentNumber || idx)}
                        >
                          Remove Payment
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
