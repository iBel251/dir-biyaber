import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllMembersListOld } from '../../../../firebase/firebaseMembersServices';
import useOldMembersStore from '../../../../store/oldMembersStore';
import MemberDetailsModal from './MemberDetailsModal';

const PAGE_SIZE = 20;

const OldMembers: React.FC = () => {
  const { members, setMembers } = useOldMembersStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return members.slice(startIndex, startIndex + PAGE_SIZE);
  }, [members, currentPage]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members; // Return full data if search query is empty
    const lowerQuery = searchQuery.toLowerCase();
    return members.filter((member) =>
      (member.id && member.id.toLowerCase().includes(lowerQuery)) ||
      (member.fullName && member.fullName.toLowerCase().includes(lowerQuery)) ||
      (member.fullNameAm && member.fullNameAm.toLowerCase().includes(lowerQuery)) ||
      (member.phone && member.phone.toLowerCase().includes(lowerQuery))
    );
  }, [members, searchQuery]);

  const paginatedFilteredMembers = useMemo(() => {
    const filtered = filteredMembers;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMembers, currentPage]);

  const totalPages = useMemo(() => {
    const totalItems = searchQuery.trim() ? filteredMembers.length : members.length;
    return Math.ceil(totalItems / PAGE_SIZE);
  }, [filteredMembers, members, searchQuery]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const fetchAllOldMembers = async () => {
    if (members.length > 0) return; // Use existing data in the store if available

    setLoading(true);
    setError(null);
    try {
      const allMembers = await fetchAllMembersListOld(PAGE_SIZE);
      setMembers(allMembers); // Store fetched data in Zustand store
    } catch (err: any) {
      setError('Failed to fetch old members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOldMembers();
  }, []);

  useEffect(() => {
    const tableElement = document.querySelector('table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages); // Adjust current page if it exceeds total pages after filtering
    }
  }, [totalPages]);

  const PaginationControls = () => {
    const [inputPage, setInputPage] = useState<string>("");

    return (
      <div className="flex justify-center mt-4 items-center">
        <button
          className="px-4 py-2 bg-gray-300 rounded mr-2"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2">{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          className="px-4 py-2 bg-gray-300 rounded ml-2"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <input
          type="number"
          className="border border-gray-300 rounded px-2 py-1 mx-2 w-16 text-center"
          placeholder="Page"
          value={inputPage}
          onChange={(e) => {
            setInputPage(e.target.value); // Allow the input to be empty without validation
          }}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            const page = parseInt(inputPage, 10);
            if (!isNaN(page)) handlePageChange(page); // Validate and navigate when Go is pressed
          }}
        >
          Go
        </button>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Old Members Data</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-4">
        <input
          type="text"
          className="border border-gray-300 rounded px-4 py-2 w-full"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <PaginationControls />
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Full Name</th>
              <th className="border border-gray-300 px-4 py-2">Full Name (Amharic)</th>
              <th className="border border-gray-300 px-4 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFilteredMembers.map((member) => (
              <tr
                key={member.id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedMember(member)}
              >
                <td className="border border-gray-300 px-4 py-2">{member.id}</td>
                <td className="border border-gray-300 px-4 py-2">{member.fullName}</td>
                <td className="border border-gray-300 px-4 py-2">{member.fullNameAm}</td>
                <td className="border border-gray-300 px-4 py-2">{member.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls />
      {loading && <p className="text-gray-500 mt-4">Loading...</p>}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};

export default OldMembers;