import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold text-orange-400 mb-4">Dir Biyaber</h3>
            <p className="text-gray-300">
              Dir Biyaber Edir Mutual Assistance Association of Los Angeles is a nonprofit organization dedicated to providing financial aid to families during the challenging time of losing a loved one. We are committed to supporting our community with compassion and care.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Home</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">About Us</Link></li>
              <li><Link to="/obituary" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Obituary</Link></li>
              <li><Link to="/contact-us" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Contact Us</Link></li>
              <li><Link to="/adminLogin" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Admin Portal</Link></li>
            </ul>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex justify-center items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3 text-orange-400"></i>
                <span>1400 South Hayworth Ave, Suite 207, Los Angeles, CA 90035</span>
              </li>
              <li className="flex justify-center items-center">
                <i className="fas fa-phone mr-3 text-orange-400"></i>
                <span>+1 (323) 297-3507</span>
              </li>
              <li className="flex justify-center items-center">
                <i className="fas fa-envelope mr-3 text-orange-400"></i>
                <span>dirbiyaber@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Dir Biyaber Edir Mutual Assistance Association. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-300 cursor-pointer">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-300 cursor-pointer">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
