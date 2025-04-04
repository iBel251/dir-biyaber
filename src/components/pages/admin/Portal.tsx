// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState } from 'react';

const App: React.FC = () => {
  // State for active sidebar item
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // State for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State for obituary data
  const [obituaries, setObituaries] = useState([
    { id: 1, name: 'John Doe', date: '2025-03-28', status: 'Published' },
    { id: 2, name: 'Jane Smith', date: '2025-03-30', status: 'Pending' },
    { id: 3, name: 'Robert Johnson', date: '2025-04-01', status: 'Published' },
    { id: 4, name: 'Emily Williams', date: '2025-04-02', status: 'Draft' },
    { id: 5, name: 'Michael Brown', date: '2025-04-03', status: 'Published' },
  ]);
  
  // State for board members data
  const [boardMembers, setBoardMembers] = useState([
    { id: 1, name: 'David Wilson', position: 'Chairman', email: 'david.wilson@example.com', phone: '(555) 123-4567' },
    { id: 2, name: 'Sarah Johnson', position: 'Vice Chairman', email: 'sarah.johnson@example.com', phone: '(555) 234-5678' },
    { id: 3, name: 'Thomas Lee', position: 'Secretary', email: 'thomas.lee@example.com', phone: '(555) 345-6789' },
    { id: 4, name: 'Rebecca Martinez', position: 'Treasurer', email: 'rebecca.martinez@example.com', phone: '(555) 456-7890' },
    { id: 5, name: 'James Taylor', position: 'Member', email: 'james.taylor@example.com', phone: '(555) 567-8901' },
  ]);
  
  // State for search queries
  const [obituarySearch, setObituarySearch] = useState('');
  const [boardMemberSearch, setBoardMemberSearch] = useState('');
  
  // State for modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBoardMemberModal, setShowBoardMemberModal] = useState(false);
  const [showObituaryModal, setShowObituaryModal] = useState(false);
  
  // State for item being edited/deleted
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // State for form data
  const [boardMemberForm, setBoardMemberForm] = useState({
    id: 0,
    name: '',
    position: '',
    email: '',
    phone: ''
  });
  
  // Filter obituaries based on search
  const filteredObituaries = obituaries.filter(obituary => 
    obituary.name.toLowerCase().includes(obituarySearch.toLowerCase()) ||
    obituary.status.toLowerCase().includes(obituarySearch.toLowerCase())
  );
  
  // Filter board members based on search
  const filteredBoardMembers = boardMembers.filter(member => 
    member.name.toLowerCase().includes(boardMemberSearch.toLowerCase()) ||
    member.position.toLowerCase().includes(boardMemberSearch.toLowerCase())
  );
  
  // Handle delete obituary
  const handleDeleteObituary = (id: number) => {
    setObituaries(obituaries.filter(obituary => obituary.id !== id));
    setShowDeleteConfirm(false);
  };
  
  // Handle delete board member
  const handleDeleteBoardMember = (id: number) => {
    setBoardMembers(boardMembers.filter(member => member.id !== id));
    setShowDeleteConfirm(false);
  };
  
  // Handle save board member
  const handleSaveBoardMember = () => {
    if (boardMemberForm.id === 0) {
      // Add new board member
      const newMember = {
        ...boardMemberForm,
        id: boardMembers.length + 1
      };
      setBoardMembers([...boardMembers, newMember]);
    } else {
      // Update existing board member
      setBoardMembers(boardMembers.map(member => 
        member.id === boardMemberForm.id ? boardMemberForm : member
      ));
    }
    setShowBoardMemberModal(false);
    setBoardMemberForm({ id: 0, name: '', position: '', email: '', phone: '' });
  };
  
  // Function to edit board member
  const editBoardMember = (member: any) => {
    setBoardMemberForm(member);
    setShowBoardMemberModal(true);
  };
  
  // Function to get content based on active menu item
  const getContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-2">Total Obituaries</h2>
                <p className="text-3xl font-bold text-blue-600">{obituaries.length}</p>
                <p className="text-sm text-gray-500 mt-2">Last updated: April 4, 2025</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-2">Board Members</h2>
                <p className="text-3xl font-bold text-green-600">{boardMembers.length}</p>
                <p className="text-sm text-gray-500 mt-2">Last updated: April 4, 2025</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
                <p className="text-3xl font-bold text-purple-600">12</p>
                <p className="text-sm text-gray-500 mt-2">Last 7 days</p>
              </div>
            </div>
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Obituaries</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {obituaries.slice(0, 5).map((obituary) => (
                      <tr key={obituary.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{obituary.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{obituary.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            obituary.status === 'Published' ? 'bg-green-100 text-green-800' : 
                            obituary.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {obituary.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'obituaries':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Obituary Management</h1>
              <button 
                onClick={() => setShowObituaryModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> Add New Obituary
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-search text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Search obituaries..."
                      value={obituarySearch}
                      onChange={(e) => setObituarySearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select className="border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option>All Statuses</option>
                      <option>Published</option>
                      <option>Pending</option>
                      <option>Draft</option>
                    </select>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap">
                      <i className="fas fa-filter mr-2"></i> Filter
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredObituaries.map((obituary) => (
                      <tr key={obituary.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{obituary.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{obituary.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            obituary.status === 'Published' ? 'bg-green-100 text-green-800' : 
                            obituary.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {obituary.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            onClick={() => {
                              setCurrentItem(obituary);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredObituaries.length}</span> of <span className="font-medium">{obituaries.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-white text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium !rounded-button cursor-pointer whitespace-nowrap">
                    Previous
                  </button>
                  <button className="bg-white text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium !rounded-button cursor-pointer whitespace-nowrap">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'board-members':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Board Member Management</h1>
              <button 
                onClick={() => {
                  setBoardMemberForm({ id: 0, name: '', position: '', email: '', phone: '' });
                  setShowBoardMemberModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> Add Board Member
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Search board members..."
                    value={boardMemberSearch}
                    onChange={(e) => setBoardMemberSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBoardMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{member.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                            onClick={() => editBoardMember(member)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            onClick={() => {
                              setCurrentItem(member);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredBoardMembers.length}</span> of <span className="font-medium">{boardMembers.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-white text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium !rounded-button cursor-pointer whitespace-nowrap">
                    Previous
                  </button>
                  <button className="bg-white text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium !rounded-button cursor-pointer whitespace-nowrap">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Reports</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Obituary Statistics</h2>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Chart placeholder - Obituary statistics by month</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Board Member Activity</h2>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Chart placeholder - Board member activity</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };
  
  return (
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
                  onClick={() => setActiveItem('dashboard')}
                  className={`flex items-center w-full px-4 py-3 ${activeItem === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
                >
                  <i className="fas fa-tachometer-alt w-5"></i>
                  <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Dashboard</span>
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
                  onClick={() => setActiveItem('board-members')}
                  className={`flex items-center w-full px-4 py-3 ${activeItem === 'board-members' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
                >
                  <i className="fas fa-users w-5"></i>
                  <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Board Members</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveItem('reports')}
                  className={`flex items-center w-full px-4 py-3 ${activeItem === 'reports' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'} cursor-pointer`}
                >
                  <i className="fas fa-chart-bar w-5"></i>
                  <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Reports</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete {currentItem?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button 
                onClick={() => activeItem === 'obituaries' ? handleDeleteObituary(currentItem.id) : handleDeleteBoardMember(currentItem.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Board Member Modal */}
      {showBoardMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {boardMemberForm.id === 0 ? 'Add New Board Member' : 'Edit Board Member'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={boardMemberForm.name}
                  onChange={(e) => setBoardMemberForm({...boardMemberForm, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  id="position"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={boardMemberForm.position}
                  onChange={(e) => setBoardMemberForm({...boardMemberForm, position: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={boardMemberForm.email}
                  onChange={(e) => setBoardMemberForm({...boardMemberForm, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  id="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={boardMemberForm.phone}
                  onChange={(e) => setBoardMemberForm({...boardMemberForm, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowBoardMemberModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBoardMember}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Obituary Modal */}
      {showObituaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Obituary</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="obit-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="obit-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birth-date" className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input
                    type="date"
                    id="birth-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="death-date" className="block text-sm font-medium text-gray-700 mb-1">Death Date</label>
                  <input
                    type="date"
                    id="death-date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="obituary-text" className="block text-sm font-medium text-gray-700 mb-1">Obituary Text</label>
                <textarea
                  id="obituary-text"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter obituary text here..."
                ></textarea>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowObituaryModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowObituaryModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 !rounded-button cursor-pointer whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

