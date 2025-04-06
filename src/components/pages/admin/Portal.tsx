// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { logout } from '../../../firebase/authService'; // Import the logout function
import Sidebar from './Sidebar';
import ObituaryModal from './ObituaryModal';
import BoardMemberModal from './BoardMemberModal';

const App: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  // State for active sidebar item
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // State for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Function to get content based on active menu item
  const getContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          </div>
        );
      case 'obituaries':
        // Render Obituary page directly
        return <ObituaryModal />;
      case 'board-members':
        // Render BoardMember page directly
        return <BoardMemberModal />;
      default:
        return <div>Page not found</div>;
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function
      navigate('/adminLogin'); // Redirect to the login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Portal - Dirbiyaber</title>
      </Helmet>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <i className="fas fa-person text-blue-600 text-2xl mr-2"></i>
                  <span className="text-xl font-bold text-gray-900">Admin</span>
                </div>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={handleLogout} // Attach the logout handler
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 !rounded-button cursor-pointer whitespace-nowrap"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar 
            sidebarCollapsed={sidebarCollapsed} 
            setSidebarCollapsed={setSidebarCollapsed} 
            activeItem={activeItem} 
            setActiveItem={setActiveItem} 
          />
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {/* Breadcrumbs */}
            <div className="bg-white border-b px-6 py-3">
              <div className="text-sm text-gray-500">
                <span className="text-blue-600">Home</span> / 
                <span className="ml-2 capitalize">{activeItem}</span>
              </div>
            </div>
            
            {/* Dynamic Content */}
            {getContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;

