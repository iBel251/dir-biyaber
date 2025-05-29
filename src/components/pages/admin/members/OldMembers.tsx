import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllMembersListOld } from '../../../../firebase/firebaseMembersServices';
import useOldMembersStore from '../../../../store/oldMembersStore';
import MemberDetailsModal from './MemberDetailsModal';
import AddMemberModal from './AddMemberModal';
import { GridLoader } from 'react-spinners';

const PAGE_SIZE = 20;

interface OldMembersProps {
  adminRole?: string;
}

const OldMembers: React.FC<OldMembersProps> = ({ adminRole }) => {
  const { members, setMembers, sortMembersAZ, sortMembersZA, filterMembersByStatus, sortMembersById } = useOldMembersStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Record<string, any> | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'id'>('name');

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

  // Remove status filter from filteredAndSortedMembers, since filtering is now handled by the store
  const filteredAndSortedMembers = useMemo(() => {
    // Filter
    let filtered = members;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = members.filter((member) =>
        (member.id && member.id.toLowerCase().includes(lowerQuery)) ||
        (member.fullName && member.fullName.toLowerCase().includes(lowerQuery)) ||
        (member.fullNameAm && member.fullNameAm.toLowerCase().includes(lowerQuery)) ||
        (member.phone && member.phone.toLowerCase().includes(lowerQuery))
      );
    }
    // Sort
    if (sortField === 'name') {
      return [...filtered].sort((a, b) => {
        const nameA = a.fullName || '';
        const nameB = b.fullName || '';
        if (!nameA && !nameB) return 0;
        if (!nameA) return sortOrder === 'asc' ? -1 : 1;
        if (!nameB) return sortOrder === 'asc' ? 1 : -1;
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }
    // ID sort: store state already sorted
    return filtered;
  }, [members, searchQuery, sortOrder, sortField]);

  const paginatedFilteredAndSortedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedMembers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedMembers, currentPage]);

  const totalPages = useMemo(() => {
    const totalItems = searchQuery.trim() ? filteredMembers.length : members.length;
    return Math.ceil(totalItems / PAGE_SIZE);
  }, [filteredMembers, members, searchQuery]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to page 1 whenever the search query changes
  };

  const fetchAllOldMembers = async () => {
    if (members.length > 0) return; // Use existing data in the store if available

    setLoading(true);
    setError(null);
    try {
      const allMembers = await fetchAllMembersListOld(PAGE_SIZE);
      const formattedMembers = allMembers.map((member) => ({
        id: member.id,
        fullName: member.fullName || '',
        fullNameAm: member.fullNameAm || '',
        phone: member.phone || '',
        status: member.status || '',
        email: member.email || '',
        addressLine1: member.addressLine1 || '',
        apartment: member.apartment || '',
        city: member.city || '',
        state: member.state || '',
        zipCode: member.zipCode || '',
        newId: member.newId || '',
        dateOfBirth: member.dateOfBirth || '',
        additionalFields: member.additionalFields || {},
        // Add any other fields you want to preserve
      }));
      setMembers(formattedMembers); // Store fetched data in Zustand store
      setCurrentPage(1); // Reset to page 1 after data is loaded
    } catch (err: any) {
      setError('Failed to fetch old members');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const refreshedMembers = await fetchAllMembersListOld(PAGE_SIZE);
      const formattedMembers = refreshedMembers.map((member) => ({
        id: member.id,
        fullName: member.fullName || '',
        fullNameAm: member.fullNameAm || '',
        phone: member.phone || '',
        status: member.status || '',
        email: member.email || '',
        addressLine1: member.addressLine1 || '',
        apartment: member.apartment || '',
        city: member.city || '',
        state: member.state || '',
        zipCode: member.zipCode || '',
        newId: member.newId || '',
        additionalFields: member.additionalFields || {},
      }));
      setMembers(formattedMembers);
      setCurrentPage(1);
      console.log('Member list refreshed successfully');
    } catch (err: any) {
      setError('Failed to refresh members');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    filterMembersByStatus(status || 'All');
    setCurrentPage(1); // Reset to page 1 whenever the filter changes
  };

  // Helper to style rows based on status
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'active':
        // Greenish bg, blackish text
        return 'bg-green-400 text-gray-900';
      case 'warning':
        // Yellowish bg, black text
        return 'bg-yellow-300 text-gray-900';
      case 'stopped':
        // Red bg, white text
        return 'bg-red-600 text-white';
      case 'deceased':
        // Blackish bg, white text
        return 'bg-gray-800 text-white';
      default:
        // Default: white bg, black text
        return 'bg-white text-gray-900';
    }
  };

  useEffect(() => {
    // Always reset status filter to 'All' when the page is mounted (sidebar switch)
    setStatusFilter('');
    filterMembersByStatus('All');
    fetchAllOldMembers();
  }, []);

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
      {error && <p className="text-red-500">{error}</p>}
      {!loading && (
        <>
          <div className="flex justify-end mb-4">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh List'}
            </button>
            <button
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-2 ${adminRole !== 'superAdmin' ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => adminRole === 'superAdmin' && setShowAddModal(true)}
              disabled={adminRole !== 'superAdmin'}
            >
              Add Member
            </button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              className="border border-gray-300 rounded px-4 py-2 w-full"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex justify-between mb-4">
            <div>
              <label className="mr-2">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="stopped">Stopped</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSortField('name');
                  if (sortOrder === 'asc') {
                    sortMembersZA();
                    setSortOrder('desc');
                  } else {
                    sortMembersAZ();
                    setSortOrder('asc');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Sort: {sortField === 'name' && (sortOrder === 'asc' ? 'A to Z' : 'Z to A')}
              </button>
              <button
                onClick={() => {
                  setSortField('id');
                  sortMembersById();
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Sort by ID
              </button>
            </div>
          </div>
          <PaginationControls />
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">ID</th>
                  <th className="border border-gray-300 px-4 py-2">New ID</th>
                  <th className="border border-gray-300 px-4 py-2">Full Name</th>
                  <th className="border border-gray-300 px-4 py-2">Full Name (Amharic)</th>
                  <th className="border border-gray-300 px-4 py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFilteredAndSortedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`cursor-pointer ${getStatusClasses(member.status)} hover:border-l-4 hover:border-indigo-500 hover:shadow`} 
                    onClick={() => setSelectedMember(member)}
                  >
                    <td className="border border-gray-300 px-4 py-2 max-w-[120px] truncate" title={member.id}>{member.id?.length > 5 ? member.id.slice(0, 5) + '...' : member.id}</td>
                    <td className="border border-gray-300 px-4 py-2 max-w-[120px] truncate" title={member.newId}>{member.newId?.length > 5 ? member.newId.slice(0, 5) + '...' : member.newId}</td>
                    <td className="border border-gray-300 px-4 py-2">{member.fullName}</td>
                    <td className="border border-gray-300 px-4 py-2">{member.fullNameAm}</td>
                    <td className="border border-gray-300 px-4 py-2">{member.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls />
        </>
      )}
      {loading && (
        <div className="flex flex-col justify-center items-center mt-4">
          <GridLoader size={50} color="#3498db" />
          <p className="text-gray-500 mt-2">Loading data, please wait...</p>
        </div>
      )}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          adminRole={adminRole}
        />
      )}
      {showAddModal && (
        <AddMemberModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default OldMembers;