/// <reference types="react" />
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom"; // Import Link and useLocation for navigation
import Select, { SingleValue } from "react-select"; // Import react-select and SingleValue
import type { JSX } from "react"; // Explicitly import JSX

const Navigation: React.FC<{ onLanguageChange: (lang: string) => void }> = ({ onLanguageChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation(); // Get the current location

  const languageOptions = [
    { value: "en", label: <div className="flex items-center"><img src="/images/us.png" alt="English" className="w-5 h-4 mr-2" />English</div> },
    { value: "am", label: <div className="flex items-center"><img src="/images/et.png" alt="Amharic" className="w-5 h-4 mr-2" />አማርኛ</div> },
  ];

  const handleLanguageChange = (selectedOption: SingleValue<{ value: string; label: JSX.Element }>) => {
    if (selectedOption) {
      onLanguageChange(selectedOption.value);
      localStorage.setItem("preferredLanguage", selectedOption.value); // Persist language
    }
  };

  const defaultLanguage = localStorage.getItem("preferredLanguage") || "en"; // Retrieve persisted language
  const defaultOption = languageOptions.find(option => option.value === defaultLanguage);

  return (
    <nav className="bg-white shadow-md fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src="/images/logonew.jpg" alt="Logo" className="h-full mr-2 ml-0" /> {/* Adjust logo height to fill nav */}
            <div className="text-2xl font-bold text-blue-900">ድር ቢያብር Dir Biyaber LA</div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/blogs"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/blogs" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Blogs
            </Link>
            <Link
              to="/announcement"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/announcement" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >Announcements</Link>
            <Link
              to="/about"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/about" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              About
            </Link>
            <Link
              to="/bylaws"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/bylaws" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Bylaws
            </Link>
            <Link
              to="/forms"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/forms" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Forms
            </Link>
            <Link
              to="/obituary"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/obituary" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Obituary
            </Link>
            <Link
              to="/contact-us"
              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/contact-us" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Contact Us
            </Link>

            <div className="relative flex items-center space-x-2">
              <Select
                options={languageOptions}
                defaultValue={defaultOption} // Use persisted language
                className="w-28" // Adjust width for medium devices
                isSearchable={false}
                onChange={handleLanguageChange}
              />
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-orange-500 cursor-pointer !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-md">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/blogs"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/blogs" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Blogs
            </Link>
            <Link
              to="/announcement"
              onClick={() => setIsMenuOpen(false)}

              className={`text-gray-700 hover:text-orange-500 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                location.pathname === "/announcement" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >Announcements</Link>
            <Link
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/about" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              About
            </Link>
            <Link
              to="/bylaws"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/bylaws" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Bylaws
            </Link>
            <Link
              to="/forms"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/forms" ? "font-bold text-orange-500 underline underline-offset-4" : ""}`}
            >
              Forms
            </Link>
            <Link
              to="/obituary"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/obituary" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Obituary
            </Link>
            <Link
              to="/contact-us"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-300 ${
                location.pathname === "/contact-us" ? "font-bold text-orange-500 underline underline-offset-4" : ""
              }`}
            >
              Contact Us
            </Link>

            <div className="relative flex items-center px-4 py-2">
              <i className="fas fa-globe text-gray-700 mr-2"></i>
              <Select
                options={languageOptions}
                defaultValue={defaultOption} // Use persisted language
                className="w-28 md:w-24" // Adjust width for medium devices
                isSearchable={false}
                onChange={handleLanguageChange}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
