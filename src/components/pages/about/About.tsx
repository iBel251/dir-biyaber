import React from "react";
import { teamMembers } from "./teamMembers";

const App: React.FC<{ language: string }> = ({ language }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {language === "en" ? "About Dir Biyaber Edir" : "ስለ ድርቢያብር እድር"}
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto mb-4"></div>
          <div className="mb-4">
            <img
              src="/images/logonew.jpg"
              alt="Dir Biyaber Edir Logo"
              className="mx-auto w-48 h-auto"
            />
          </div>
        </div>

        {/* About Text Section */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Dir Biyaber Edir Mutual Assistance Association of Los Angeles is a nonprofit organization based in Los Angeles, California. Our primary mission is to provide financial aid to families during the challenging time of losing a loved one.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We offer the necessary financial support to cover funeral expenses, alleviating the financial burden during such difficult times. Headquartered at 1400 S Hayworth Avenue 207 in Los Angeles, CA 90035, we are committed to supporting our community with compassion and care.
          </p>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden mb-6">
                    <img
                      src={member.imageUrl}
                      alt={`${member.name}, ${member.role}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-indigo-600 font-medium mb-3">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-indigo-50 rounded-xl p-10 mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-indigo-600 mb-4">
                <i className="fas fa-users text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Compassion</h3>
              <p className="text-gray-600">
                We are dedicated to supporting families with empathy and care during their most challenging times.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-indigo-600 mb-4">
                <i className="fas fa-handshake text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Support</h3>
              <p className="text-gray-600">
                We provide financial assistance to ease the burden of funeral expenses for grieving families.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-indigo-600 mb-4">
                <i className="fas fa-lightbulb text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-gray-600">
                We foster a sense of togetherness and mutual support within our community.
              </p>
            </div>
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Join Our Community
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Become a part of Dir Biyaber Edir and help us support families in need. Together, we can make a difference during life's most difficult moments.
          </p>
          <button className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors duration-300 !rounded-button cursor-pointer whitespace-nowrap">
            Get Involved
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
