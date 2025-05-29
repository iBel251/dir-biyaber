import React, { useState } from 'react';
import useAddedDataStore from '../../../../store/addedDataStore'
import { fetchAllMembersAddedData } from '../../../../firebase/firebaseMemberAddedDataServices';
import MemberDetailPage from './MemberDetailPage';

interface AddedDataPageProps {
  adminRole?: string;
}

const AddedDataPage: React.FC<AddedDataPageProps> = ({ adminRole }) => {
  const { addedData, setAddedData, sortAddedData, searchAddedData, restoreFullData } = useAddedDataStore();
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'firstName' | 'membershipId'>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleLoadLatest = async () => {
    setLoading(true);
    try {
      const data = await fetchAllMembersAddedData();
      setAddedData(data);
    } catch (error) {
      alert('Failed to load latest data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (by: 'firstName' | 'membershipId') => {
    const newOrder = sortBy === by && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(by);
    setSortOrder(newOrder);
    sortAddedData(by, newOrder);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      restoreFullData();
    } else {
      searchAddedData(value);
    }
  };

  if (selectedId) {
    return <MemberDetailPage id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Members Added Data</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60"
        onClick={handleLoadLatest}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load Latest Data'}
      </button>
      <input
        type="text"
        className="mb-4 px-4 py-2 border border-gray-300 rounded w-full"
        placeholder="Search by ID, name, email, phone, or address..."
        value={search}
        onChange={handleSearchChange}
        disabled={loading}
      />
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${sortBy === 'firstName' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-700`}
          onClick={() => handleSort('firstName')}
          disabled={loading}
        >
          Sort by Name {sortBy === 'firstName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
        </button>
        <button
          className={`px-4 py-2 rounded ${sortBy === 'membershipId' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-700`}
          onClick={() => handleSort('membershipId')}
          disabled={loading}
        >
          Sort by Membership ID {sortBy === 'membershipId' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
          <span className="ml-4 text-blue-600 text-lg">Loading data...</span>
        </div>
      ) : addedData.length === 0 ? (
        <p className="text-gray-700">No added member data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Membership ID</th>
                <th className="border border-gray-300 px-4 py-2">Full Name</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {addedData.map((row, idx) => (
                <tr key={row.id || row.docId || idx} className="cursor-pointer hover:bg-gray-100" onClick={() => setSelectedId(row.id || row.docId || row.membershipId)}>
                  <td className="border border-gray-300 px-4 py-2">{row.membershipId}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.firstName} {row.lastName}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.email}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AddedDataPage;
