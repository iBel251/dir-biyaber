import React from 'react';

interface MembersTableProps {
  members: any[];
  loading: boolean;
  error: string | null;
  onRowClick: (id: string) => void;
}

const MembersTable: React.FC<MembersTableProps> = ({ members, loading, error, onRowClick }) => {
  if (loading) return <div>Loading members...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!members.length) return <div>No members found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-3 py-2 border">ID</th>
            <th className="px-3 py-2 border">First Name (EN)</th>
            <th className="px-3 py-2 border">Last Name (EN)</th>
            <th className="px-3 py-2 border">First Name (AM)</th>
            <th className="px-3 py-2 border">Last Name (AM)</th>
            <th className="px-3 py-2 border">Date of Birth</th>
            <th className="px-3 py-2 border">Address</th>
            <th className="px-3 py-2 border">Email</th>
            <th className="px-3 py-2 border">Phone</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="cursor-pointer hover:bg-blue-50" onClick={() => onRowClick(member.id)}>
              <td className="px-3 py-2 border">{member.id}</td>
              <td className="px-3 py-2 border">{member.firstName}</td>
              <td className="px-3 py-2 border">{member.lastName}</td>
              <td className="px-3 py-2 border">{member.firstNameAmharic}</td>
              <td className="px-3 py-2 border">{member.lastNameAmharic}</td>
              <td className="px-3 py-2 border">{member.dateOfBirth}</td>
              <td className="px-3 py-2 border">{member.address}</td>
              <td className="px-3 py-2 border">{member.email}</td>
              <td className="px-3 py-2 border">{member.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MembersTable;
