import React from 'react';

interface DeceasedPerson {
  name: string;
  dateOfPassing: string;
}

const LatestDeceased: React.FC<{ person: DeceasedPerson }> = ({ person }) => {
  return (
    <section id="latest-deceased" className="py-4 bg-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          
      {/* Text Section */}
          <div className="md:w-1/2 text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Announcement from the Board</h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              We regret to announce the passing of a beloved community member. Let us come together to support the family during this difficult time.
            </p>
            <p className="text-gray-600 text-lg mb-4">
              <strong>{person.name}</strong> <br />
              <strong>Date of Passing</strong> - {person.dateOfPassing}
            </p>

          </div>
          {/* Image Section */}
          <div className="md:w-1/2">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="/images/deceased110.jpg" 
                alt={person.name} 
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestDeceased;
