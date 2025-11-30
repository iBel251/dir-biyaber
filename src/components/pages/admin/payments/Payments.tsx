import React from 'react';
import ActiveList from './ActiveList';
import AddPayment from './AddPayment';

const Payments: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <AddPayment />
      <ActiveList />
    
    
  </div>
  );
};

export default Payments;
