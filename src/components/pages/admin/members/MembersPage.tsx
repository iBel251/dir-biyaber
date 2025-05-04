import React, { useState, useEffect, useMemo } from 'react';
import AddMemberModal from './AddMemberModal';
import MembersTable from './MembersTable';
import { fetchMembers, uploadMembersFromCSV } from '../../../../firebase/firebaseMembersServices';
import MemberDetailPage from './MemberDetailPage';
import MembersSearchBar from './MembersSearchBar';
import MembersPagination from './MembersPagination';
import oldMembers from './OldMembers';
import OldMembers from './OldMembers';

const PAGE_SIZE = 20;

const MembersPage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const getMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (err: any) {
      setError('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first.');
      return;
    }
    try {
      await uploadMembersFromCSV(csvFile);
      alert('CSV data successfully uploaded.');
      getMembers(); // Refresh members list after upload
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Failed to upload CSV data.');
    }
  };

  useEffect(() => {
    getMembers();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search
  }, [searchText]);

  const filteredMembers = useMemo(() => {
    if (!searchText.trim()) return members;
    const lower = searchText.trim().toLowerCase();
    return members.filter((m) =>
      (m.firstName && m.firstName.toLowerCase().includes(lower)) ||
      (m.lastName && m.lastName.toLowerCase().includes(lower)) ||
      (m.firstNameAmharic && m.firstNameAmharic.toLowerCase().includes(lower)) ||
      (m.lastNameAmharic && m.lastNameAmharic.toLowerCase().includes(lower)) ||
      (m.email && m.email.toLowerCase().includes(lower)) ||
      (m.id && m.id.toLowerCase().includes(lower)) ||
      (m.phone && m.phone.toLowerCase().includes(lower))
    );
  }, [members, searchText]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, currentPage]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Members</h1>
      {!selectedMemberId && (
        <>
          {/* <div className="mb-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
            />
            <button
              className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleCsvUpload}
            >
              Upload CSV
            </button>
          </div> */}
          <MembersSearchBar searchText={searchText} setSearchText={setSearchText} />
          <MembersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowAddModal(true)}
          >
            Add Member
          </button>
          {showAddModal && (
            <AddMemberModal onClose={() => { setShowAddModal(false); getMembers(); }} />
          )}
          <div>
            <MembersTable 
              members={paginatedMembers} 
              loading={loading} 
              error={error} 
              onRowClick={(id: string) => setSelectedMemberId(id)}
            />
          </div>
          <MembersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      {selectedMemberId && (
        <MemberDetailPage 
          memberId={selectedMemberId} 
          onBack={() => setSelectedMemberId(null)}
        />
      )}
      <OldMembers />
    </div>
  );
};

export default MembersPage;
