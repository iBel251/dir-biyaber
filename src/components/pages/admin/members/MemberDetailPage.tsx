import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
}

const MemberDetailPage: React.FC<MemberDetailPageProps> = ({ memberId, onBack }) => {
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'members', memberId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMember({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Member not found');
        }
      } catch (err: any) {
        setError('Failed to fetch member details');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [memberId]);

  return (
    <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl mx-auto">
      <button className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={onBack}>&larr; Back to Members List</button>
      <h2 className="text-xl font-bold mb-4">Member Details</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : member ? (
        <div className="space-y-2">
          <div><strong>ID:</strong> {member.id}</div>
          <div><strong>First Name (EN):</strong> {member.firstName}</div>
          <div><strong>Last Name (EN):</strong> {member.lastName}</div>
          <div><strong>First Name (AM):</strong> {member.firstNameAmharic}</div>
          <div><strong>Last Name (AM):</strong> {member.lastNameAmharic}</div>
          <div><strong>Date of Birth:</strong> {member.dateOfBirth}</div>
          <div><strong>Address:</strong> {member.address}</div>
          <div><strong>Email:</strong> {member.email}</div>
          <div><strong>Phone:</strong> {member.phone}</div>
          {/* Payments and other details can be added here */}
        </div>
      ) : null}
    </div>
  );
};

export default MemberDetailPage;
