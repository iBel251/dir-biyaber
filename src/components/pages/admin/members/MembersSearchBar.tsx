import React from 'react';

interface MembersSearchBarProps {
  searchText: string;
  setSearchText: (text: string) => void;
}

const MembersSearchBar: React.FC<MembersSearchBarProps> = ({ searchText, setSearchText }) => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <input
        type="text"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        placeholder="Search by name, email, id, or phone..."
        className="border p-2 rounded w-full max-w-md"
      />
    </div>
  );
};

export default MembersSearchBar;
