// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React from 'react';

const App: React.FC = () => {
  // Sample PDF URL - replace with your actual PDF URL
  const bylawsPdfUrl = "/files/laws.pdf";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dirbyaber Community Bylaws & Rules</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our bylaws serve as the foundation for our community governance, outlining the rights and responsibilities of all members. Understanding these rules ensures a harmonious and productive environment for everyone involved.
          </p>
          <div className="h-0.5 w-full bg-gray-200 mt-8"></div>
        </div>

        {/* Action Button Area */}
        <div className="mb-8">
          <a 
            href={bylawsPdfUrl} 
            download="Dirbyaber-Community-Bylaws.pdf"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-button bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition duration-150 ease-in-out cursor-pointer whitespace-nowrap"
          >
            <i className="fas fa-file-pdf mr-2"></i>
            Download PDF
          </a>
          <p className="mt-3 text-sm text-gray-500">
            Download the complete bylaws document for offline reference.
          </p>
        </div>

        {/* Document Viewer Section */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <div className="w-full overflow-hidden rounded-md border border-gray-300">
            <iframe 
              src={`${bylawsPdfUrl}#view=FitH`}
              className="w-full"
              style={{ height: '750px' }}
              title="Community Bylaws Document"
            ></iframe>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <i className="fas fa-info-circle mr-1"></i>
              Having trouble viewing the document? You can download it using the button above.
            </p>
          </div>
        </div>

        {/* Additional Information */} 
        <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bylaws Overview</h2>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Questions?</h3>
            <p className="text-gray-700">
              If you have any questions about our bylaws or need clarification on specific rules, please contact our community administrator at <a href="mailto:admin@dirbyaber.org" className="text-blue-600 hover:text-blue-800 cursor-pointer">admin@dirbyaber.org</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

