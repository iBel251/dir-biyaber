import React, { useEffect, useState } from 'react';
import { fetchPaymentById, fetchMemberById } from '../../../../firebase/firebasePaymentsServices';

interface ListPaidPeopleProps {
  paymentId: string;
}

const ListPaidPeople: React.FC<ListPaidPeopleProps> = ({ paymentId }) => {
  const [members, setMembers] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState<Record<string, any> | null>(null);
  const [selectedPaymentData, setSelectedPaymentData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchPaymentById(paymentId)
      .then(async (data) => {
        console.log('Fetched payment data:', data);
        if (data) {
          // Only keep values that are objects (member payments)
          const memberEntries = Object.entries(data)
            .filter(([_, v]) => v && typeof v === 'object' && !Array.isArray(v));
          // Fetch member details for each member id
          const memberDetails = await Promise.all(
            memberEntries.map(async ([id, v]) => {
              const member = await fetchMemberById(id);
              if (member && typeof member === 'object') {
                return { ...member, paymentId: id };
              } else if (v && typeof v === 'object' && !Array.isArray(v)) {
                return Object.assign({}, v, { paymentId: id });
              } else {
                return { paymentId: id };
              }
            })
          );
          console.log('Fetched members data:', memberDetails);
          setMembers(memberDetails);
        } else {
          setMembers([]);
        }
        setError('');
      })
      .catch(() => setError('Failed to fetch paid members.'))
      .finally(() => setLoading(false));
  }, [paymentId]);

  const handleMemberClick = (member: Record<string, any>) => {
    setSelectedMember(member);
    // Find payment data for this member from the payment doc
    fetchPaymentById(paymentId).then((paymentDoc: Record<string, any> | null) => {
      const memberKey = String(member.id ?? member.paymentId);
      if (paymentDoc && memberKey && typeof paymentDoc[memberKey] === 'object') {
        setSelectedPaymentData(paymentDoc[memberKey]);
      } else {
        setSelectedPaymentData(null);
      }
    });
  };

  return (
    <div className="p-6 min-w-[320px] max-w-4xl w-full">
      <h2 className="text-2xl font-bold mb-4">Paid Members for Payment #{paymentId}</h2>
      {loading ? (
        <div className="text-blue-600 font-semibold animate-pulse">Fetching paid members...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="flex gap-8">
          <div className="flex-[3] min-w-0">
            <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Full Name (Am)</th>
                  <th className="px-3 py-2 text-left">Full Name</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">No paid members found.</td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <tr key={m.id || m.paymentId || idx} className={`border-t cursor-pointer hover:bg-blue-50 ${selectedMember?.id === m.id ? 'bg-blue-100' : ''}`} onClick={() => handleMemberClick(m)}>
                      <td className="px-3 py-2">{m.id || m.paymentId || ''}</td>
                      <td className="px-3 py-2">{m.fullNameAm || '-'}</td>
                      <td className="px-3 py-2">{m.fullName || '-'}</td>
                      <td className="px-3 py-2">{m.phone || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Payment detail panel */}
          <div className="flex-1 min-w-[320px] max-w-md bg-gray-50 rounded-lg p-6 border border-gray-200">
            {selectedMember && selectedPaymentData ? (
              <div>
                <h3 className="font-semibold text-lg mb-4">Payment Detail for {selectedMember.fullNameAm || selectedMember.fullName || selectedMember.id}</h3>
                <div className="flex flex-col gap-2 text-base">
                  <div><span className="font-medium">Date:</span> {selectedPaymentData.date || '-'}</div>
                  <div><span className="font-medium">Place:</span> {selectedPaymentData.place || '-'}</div>
                  <div><span className="font-medium">Method:</span> {selectedPaymentData.method || '-'}</div>
                  <div><span className="font-medium">Receipt Number:</span> {selectedPaymentData.receiptNumber || '-'}</div>
                  <div><span className="font-medium">Remark:</span> {selectedPaymentData.remark || '-'}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic">Select a member to view payment details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListPaidPeople;
