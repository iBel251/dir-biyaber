import React from 'react';

interface MemberPaymentsSectionProps {
  member: Record<string, any>;
}

const MemberPaymentsSection: React.FC<MemberPaymentsSectionProps> = ({ member }) => {
  const additionalFields = member?.additionalFields && typeof member.additionalFields === 'object' ? member.additionalFields : {};

  return (
    <div className="w-1/2 min-w-[280px] border-l pl-6">
      <h3 className="text-lg font-semibold mb-2">Payments</h3>
      {Object.keys(additionalFields).length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.entries(additionalFields).map(([key, value], idx) => {
            // If key is a number (payment number), show as payment info
            if (!isNaN(Number(key))) {
              return (
                <div key={key + idx} className="bg-gray-100 rounded p-2 text-sm">
                  <span className="font-medium">Payment {key}:</span>{' '}
                  {value == null ? (
                    <span className="text-red-500">Not paid</span>
                  ) : (
                    <span className="text-green-700">{typeof value === 'number' ? `$${value}` : String(value)}</span>
                  )}
                </div>
              );
            }
            // Otherwise, show as generic additional field
            return (
              <div key={key + idx} className="bg-gray-100 rounded p-2 text-sm">
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No additional fields found.</div>
      )}
    </div>
  );
};

export default MemberPaymentsSection;
