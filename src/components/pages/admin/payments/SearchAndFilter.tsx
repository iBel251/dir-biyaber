import React, { useState, useEffect, useRef } from 'react';
import useOldMembersStore from '../../../../store/oldMembersStore';

const SearchAndFilter: React.FC = () => {
  const members = useOldMembersStore((state) => state.members);
  const setMembers = useOldMembersStore((state) => state.setMembers);

  // Use a ref to store the original data only once
  const backupRef = useRef<any[]>([]);
  const [query, setQuery] = useState('');

  // Save backup only on mount
  useEffect(() => {
    if (backupRef.current.length === 0) {
      backupRef.current = members;
    }
    return () => {
      setMembers(backupRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // Update backupRef whenever members change and not searching
  useEffect(() => {
    if (!query.trim()) {
      backupRef.current = members;
    }
    // eslint-disable-next-line
  }, [members]);

  // Live search as user types
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setMembers(backupRef.current);
      return;
    }
    setMembers(
      backupRef.current.filter(
        (m) =>
          (m.id && m.id.toString().toLowerCase().includes(q)) ||
          (m.fullName && m.fullName.toLowerCase().includes(q)) ||
          (m.fullNameAm && m.fullNameAm.toLowerCase().includes(q))
      )
    );
    // eslint-disable-next-line
  }, [query]);

  return (
    <form className="mb-4 flex gap-2" onSubmit={e => e.preventDefault()}>
      <input
        type="text"
        placeholder="Search by ID, Name, or Name (Am)..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
    </form>
  );
};

export default SearchAndFilter;
