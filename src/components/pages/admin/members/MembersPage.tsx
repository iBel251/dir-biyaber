import React, { useState, useEffect, useMemo } from 'react';
import OldMembers from './OldMembers';

interface MembersPageProps {
  adminRole: string;
}

const MembersPage: React.FC<MembersPageProps> = ({ adminRole }) => {
  return (
    <div>
      <OldMembers adminRole={adminRole} />
    </div>
  );
};

export default MembersPage;
