import React, { useState, useEffect } from 'react';
import { createAdminUser } from '../../../firebase/authService';
import { setUserRole, fetchUserRoles, updateUserRole, removeUserRole, deleteUserByUID } from '../../../firebase/firebaseAdminServices';

const AdminRoleManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('regularAdmin');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userRoles, setUserRoles] = useState<{ email: string; name: string; role: string; uid?: string }[]>([]);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const rolesList = await fetchUserRoles();
        setUserRoles(rolesList);
      } catch (err) {
        console.error('Failed to fetch user roles:', err);
      }
    };
    loadAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    setIsLoading(true);
    try {
      const newUser = await createAdminUser(email, password);
      await setUserRole(email, role, name, newUser.uid);
      setSuccessMessage('Admin user created successfully.');
      setEmail('');
      setPassword('');
      setRole('regularAdmin');
      setName('');
      console.log("Admin user created:", { email, role, name });

      // Fetch the updated list of admins
      const updatedRoles = await fetchUserRoles();
      setUserRoles(updatedRoles);
    } catch (error) {
      console.error("Error creating admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleUpdate = async (email: string, newRole: string) => {
    try {
      const currentAdmin = userRoles.find((admin) => admin.email === email);
      if (currentAdmin?.role === 'superAdmin' && newRole !== 'superAdmin') {
        const superAdminCount = userRoles.filter((admin) => admin.role === 'superAdmin').length;
        if (superAdminCount <= 1) {
          setErrorMessage('At least one user must remain a Superadmin.');
          setTimeout(() => setErrorMessage(''), 5000); // Clear the message after 3 seconds
          return;
        }
      }

      await updateUserRole(email, newRole);
      const refreshed = await fetchUserRoles();
      setUserRoles(refreshed);
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      const adminToRemove = userRoles.find((admin) => admin.email === email);
      if (adminToRemove?.role === 'superAdmin') {
        const superAdminCount = userRoles.filter((admin) => admin.role === 'superAdmin').length;
        if (superAdminCount <= 1) {
          setErrorMessage('At least one user must remain a Superadmin.');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }

      // Remove from Firestore
      await removeUserRole(email);

      // Delete the specified admin via their UID using the callable function
      if (adminToRemove?.uid) {
        await deleteUserByUID(adminToRemove.uid);
      }

      const refreshed = await fetchUserRoles();
      setUserRoles(refreshed);
      setSuccessMessage('Admin removed successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error("Error removing admin:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Role Management</h1>
      <button 
        className="bg-blue-600 text-white px-4 py-2"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Hide Form' : 'Add Admin'}
      </button>
      {showForm && (
        <div className="mt-4">
          <input
            type="email"
            placeholder="Admin Email"
            className="border p-2 mr-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 mr-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Name"
            className="border p-2 mr-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="border p-2 mr-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="regularAdmin">Regular Admin</option>
            <option value="superAdmin">Superadmin</option>
          </select>
          <button 
            onClick={handleCreateAdmin}
            className="bg-green-600 text-white px-4 py-2"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Confirm'}
          </button>
        </div>
      )}
      {successMessage && (
        <div className="mt-2 text-green-600 font-semibold">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mt-2 text-red-600 font-semibold bg-red-100 p-2 rounded">
          {errorMessage}
        </div>
      )}
      {userRoles.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Existing Admins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userRoles.map((admin) => (
              <div key={admin.email} className="bg-white shadow p-4 rounded">
                <h3 className="font-semibold text-lg mb-1">{admin.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{admin.email}</p>
                <div className="flex flex-col items-start">
                  <select
                    className="border p-1 mb-2 w-full"
                    value={admin.role}
                    onChange={(e) => handleRoleUpdate(admin.email, e.target.value)}
                  >
                    <option value="regularAdmin">Regular Admin</option>
                    <option value="superAdmin">Superadmin</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoleManagement;
