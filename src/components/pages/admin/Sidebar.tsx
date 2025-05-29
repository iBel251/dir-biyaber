import React from 'react';
import PostsPage from './PostsPage';

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeItem: string;
  setActiveItem: (item: string) => void;
  adminRole: string; // Add adminRole prop
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarCollapsed, setSidebarCollapsed, activeItem, setActiveItem, adminRole }) => {
  return (
    <div className={`bg-gray-800 text-white ${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className={`font-semibold ${sidebarCollapsed ? 'hidden' : 'block'}`}>Admin Portal</h2>
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-gray-400 hover:text-white cursor-pointer"
        >
          <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>
      <nav className="mt-5">
        <ul>
          <li>
            <button 
              onClick={() => setActiveItem('board-members')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'board-members' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-users w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Board Members</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveItem('obituaries')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'obituaries' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-book-open w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Obituary Management</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveItem('posts')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'posts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-edit w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Posts</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveItem('forms')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'forms' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-file-alt w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Forms</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveItem('members')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'members' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-id-card w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Members</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveItem('members-added-data')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'members-added-data' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-user-plus w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Members Added Data</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveItem('payments')}
              className={`flex items-center w-full px-4 py-3 ${activeItem === 'payments' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
            >
              <i className="fas fa-money-check-alt w-5"></i>
              <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Payments</span>
            </button>
          </li>
          {adminRole === 'superAdmin' && ( // Show only for superAdmin
            <li>
              <button 
                onClick={() => setActiveItem('admin-roles')}
                className={`flex items-center w-full px-4 py-3 ${activeItem === 'admin-roles' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
              >
                <i className="fas fa-user-shield w-5"></i>
                <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Admin Roles</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

    </div>
  );
};

export default Sidebar;
