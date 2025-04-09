import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { fetchBoardMembers } from "../../../firebase/firestoreServices"; // Import Firestore service
import ValuesAndCTA from "./ValuesAndCTA"; // Import the new component

const App: React.FC<{ language: string }> = ({ language }) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const members = await fetchBoardMembers(); // Fetch data from Firestore
        setTeamMembers(members);
      } catch (error) {
        console.error("Error fetching board members:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>About Us - Dirbiyaber</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-4">
            <h1 className="amharic-text text-4xl font-bold text-gray-900 mb-4">
              {language === "en" ? "About Dir Biyaber Edir" : "ስለ ድርቢያብር እድር"}
            </h1>
            <div className="w-24 h-1 bg-indigo-600 mx-auto"></div>
            <div >
              <img
                src={`${process.env.PUBLIC_URL}/images/logobig.png`} // Updated path
                alt="Dir Biyaber Edir Logo"
                className="mx-auto w-64 h-auto" // Increased width
              />
            </div>
          </div>

          {/* About Text Section */}
          <div className="max-w-3xl mx-auto text-justify mb-12">
            <p className="amharic-text text-lg text-gray-700 leading-relaxed mb-8">
              {language === "en" ? "Dir Biyaber Edir Mutual Assistance Association of Los Angeles is a nonprofit organization based in Los Angeles, California. Our primary mission is to provide financial aid to families during the challenging time of losing a loved one." : "ድር ቢያብር እድር በሎስ አንጀለስ ካሊፎርኒያ የተመሰረተ ለትርፍ ያልተቋቋመ ድርጅት ሲሆን ዋና አላማው ወዳጅ ዘመድን በህይዎት ላጡ የማህበሩ አባላት የገንዘብ እና የተለያዩ ድጋፎችን በማድረግ እና ከጎናቸው በመቆም አስቸጋሪ ጊዜያትን እንዲሻገሩ ይረዳል።"}
            </p>
            <p className="amharic-text text-lg text-gray-700 leading-relaxed">
              {language === "en"
                ? "We offer the necessary financial support to cover funeral expenses, alleviating the financial burden during such difficult times. Headquartered at 1400 S Hayworth Avenue 207 in Los Angeles, CA 90035, we are committed to supporting our community with compassion and care."
                : "አስፈላጊ የሆኑ የቀብር ስነስርአት ወጪዎችን በመሸፈን በቤተሰብ ላይ የሚደርሰውን ድንገተኛ ጫና ለማቅለል ዋና ቢሮዋችንን በ1400 Hayworth Avenue 207 Los Angeles, CA 90035 ከፍተን ለማህበራችን አባላት አገልግሎት በመስጠት ላይ እንገኛለን።"}
            </p>
          </div>

          {/* Team Section */}
          <div className="mb-10">
            <h2
              className="amharic-text text-5xl md:text-7xl font-bold text-center text-gray-900 mb-4"
              style={{
                backgroundImage: "url('/images/bgscroll2.png')",
                backgroundSize: "110% 150%", // Stretch to fill the text background
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                display: "inline-block",
                padding: "3rem 5rem 3.5rem 5rem",
                color: "rgba(0, 0, 0, 0.8)", // Add transparency to the text
                textShadow: "1px 1px 4px rgba(255, 255, 255, 0.6)", // Subtle shadow effect
              }}
            >
              {language === "en" ? "Board Members" : "የቦርድ አባላት"}
            </h2>
            <div className="amharic-text grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-4 flex flex-col items-center text-center">
                    <div className="w-50 h-50 rounded-full overflow-hidden mb-4">
                      <img
                        src={member.imageUrl}
                        alt={`${member.nameEn}, ${member.role}`}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {language === "en" ? member.nameEn : member.nameAm}
                    </h3>
                    <p className="text-indigo-600 font-medium mb-2">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values and CTA Section */}
          <ValuesAndCTA language={language} />
        </main>
      </div>
    </>
  );
};

export default App;
