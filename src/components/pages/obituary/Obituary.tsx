import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { fetchObituaries } from '../../../firebase/firestoreServices'; // Import the fetch function

const App: React.FC = () => {
  const [obituaries, setObituaries] = useState<any[]>([]); // State to hold obituaries data
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Latest');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Fetch obituaries from Firestore on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchObituaries();
        setObituaries(data);
      } catch (error) {
        console.error('Error fetching obituaries:', error);
      }
    };
    fetchData();
  }, []);

  // Filter and sort obituaries
  const filteredObituaries = obituaries
    .filter(obituary => 
      obituary.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (yearFilter === 'All' || obituary.birthYear === yearFilter)
    )
    .sort((a, b) => {
      if (sortOption === 'Latest') {
        return b.birthYear - a.birthYear;
      } else {
        return a.nameEn.localeCompare(b.nameEn);
      }
    });

  // Available years for filter
  const years = ['All', ...Array.from(new Set(obituaries.map(obituary => obituary.birthYear)))];

  return (
    <>
      <Helmet>
        <title>Obituaries - Dirbiyaber</title>
      </Helmet>
      <div className="min-h-screen bg-white font-sans text-gray-800">
        {/* Header Section */}
        <header className="px-10 py-12 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl font-serif font-medium text-gray-800 mb-6">Obituaries</h1>
          <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
            In loving memory of those who have passed. This page is dedicated to honoring and remembering the lives of our community members. 
            We invite you to explore these tributes and celebrate the legacies they have left behind.
          </p>
          <div className="w-24 h-px bg-gray-300 mx-auto"></div>
        </header>

        {/* Search and Filter Bar */}
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            {/* Year Filter */}
            <div className="relative w-full md:w-auto">
              <button 
                className="w-full md:w-auto px-4 py-3 bg-white border border-gray-300 rounded-lg flex items-center justify-between gap-2 text-sm !rounded-button whitespace-nowrap cursor-pointer"
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowSortDropdown(false);
                }}
              >
                <span>Year: {yearFilter}</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}></i>
              </button>
              {showYearDropdown && (
                <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {years.map(year => (
                    <div 
                      key={year} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setYearFilter(year);
                        setShowYearDropdown(false);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div className="relative w-full md:w-auto">
              <button 
                className="w-full md:w-auto px-4 py-3 bg-white border border-gray-300 rounded-lg flex items-center justify-between gap-2 text-sm !rounded-button whitespace-nowrap cursor-pointer"
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowYearDropdown(false);
                }}
              >
                <span>Sort: {sortOption}</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}></i>
              </button>
              {showSortDropdown && (
                <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      setSortOption('Latest');
                      setShowSortDropdown(false);
                    }}
                  >
                    Latest
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      setSortOption('Alphabetical');
                      setShowSortDropdown(false);
                    }}
                  >
                    Alphabetical
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Obituary Grid */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          {filteredObituaries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredObituaries.map(obituary => (
                <div 
                  key={obituary.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-col items-center transition-transform duration-300 hover:transform hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gray-100">
                    <img 
                      src={obituary.imageUrl || '/placeholder.jpg'} 
                      alt={obituary.nameEn} 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-4">{obituary.number}</span>
                  <h3 className="text-xl font-semibold text-gray-800 text-center mb-1">{obituary.nameEn}</h3>
                  <h4 className="text-lg font-medium text-gray-600 text-center mb-3">{obituary.nameAm}</h4>
                  <p className="text-gray-600 mb-1 text-center">Born: {obituary.birthYear}</p>
                  <p className="text-gray-600 mb-3 text-center">Died: {new Date(obituary.deathDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No obituaries found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;

