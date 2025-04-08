import React from "react";
import { useNavigate } from "react-router-dom";

const ValuesAndCTA: React.FC<{ language: string }> = ({ language }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Values Section */}
      <div className="bg-indigo-50 rounded-xl p-10 mb-20">
        <h2 className="amharic-text text-3xl font-bold text-center text-gray-900 mb-12">
          {language === "en" ? "Our Values" : "እሴቶቻችን"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-indigo-600 mb-4">
              <i className="fas fa-users text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Compassion</h3>
            <p className="text-gray-600">
              We are dedicated to supporting families with empathy and care
              during their most challenging times.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-indigo-600 mb-4">
              <i className="fas fa-handshake text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Support</h3>
            <p className="text-gray-600">
              We provide financial assistance to ease the burden of funeral
              expenses for grieving families.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-indigo-600 mb-4">
              <i className="fas fa-lightbulb text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Community</h3>
            <p className="text-gray-600">
              We foster a sense of togetherness and mutual support within our
              community.
            </p>
          </div>
        </div>
      </div>

      {/* Join Us CTA */}
      <div className="text-center mb-20">
        <h2 className="amharic-text text-3xl font-bold text-gray-900 mb-6">
          {language === "en" ? "Join Our Community" : "ማህበራችንን ይቀላቀሉ"}
        </h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          Become a part of Dir Biyaber Edir and help us support families in
          need. Together, we can make a difference during life's most
          difficult moments.
        </p>
        <button
          onClick={() => navigate("/contact-us")}
          className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors duration-300 !rounded-button cursor-pointer whitespace-nowrap"
        >
          Get Involved
        </button>
      </div>
    </>
  );
};

export default ValuesAndCTA;
