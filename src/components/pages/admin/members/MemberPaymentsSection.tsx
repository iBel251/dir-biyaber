import React from 'react';

interface MemberPaymentsSectionProps {
  member: Record<string, any>;
}

const MemberPaymentsSection: React.FC<MemberPaymentsSectionProps> = ({ member }) => {
  // Use payments field instead of additionalFields
  const payments = Array.isArray(member?.payments) ? member.payments : [];
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const handleToggle = (paymentNumber: string) => {
    setExpanded((prev) => {
      // Collapse all others, expand only the clicked one
      const newExpanded: Record<string, boolean> = {};
      newExpanded[paymentNumber] = !prev[paymentNumber];
      return newExpanded;
    });
  };

  return (
    <div className="w-1/2 min-w-[280px] border-l pl-6 h-full">
      <h3 className="text-lg font-semibold mb-2">Payments</h3>
      {payments.length > 0 ? (
        <div className="space-y-2 overflow-y-auto h-full">
          {payments.map((payment, idx) => (
            <div key={payment.paymentNumber || idx} className="bg-gray-100 rounded p-2 text-sm">
              <button
                className="font-medium text-left w-full flex items-center justify-between focus:outline-none"
                onClick={() => handleToggle(payment.paymentNumber?.toString() || String(idx))}
              >
                <span>Payment {payment.paymentNumber}</span>
                <span className={`transition-transform ${expanded[payment.paymentNumber?.toString() || String(idx)] ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {expanded[payment.paymentNumber?.toString() || String(idx)] && (
                <div className="mt-2 ml-2 bg-white rounded p-2 border text-xs">
                  {payment.data && typeof payment.data === 'object' ? (
                    <dl className="divide-y divide-gray-100">
                      {Object.entries(payment.data).map(([k, v]) => (
                        <div key={k} className="flex py-1 gap-2">
                          <dt className="font-semibold text-gray-700 min-w-[80px]">{k}:</dt>
                          <dd className="text-gray-900 break-all">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <span className="text-gray-500">No details</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No payment data found.</div>
      )}
    </div>
  );
};

export default MemberPaymentsSection;
