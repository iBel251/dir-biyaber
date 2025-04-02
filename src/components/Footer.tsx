import React from "react";

// Ensure Font Awesome is properly included in your project (via npm or CDN).
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-orange-400 mb-4">Dirbyaber</h3>
              <p className="text-gray-300 mb-6">
                Connecting people, building community, and making a positive impact together.
              </p>
              <div className="flex justify-center space-x-4">
                <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">
                  <i className="fab fa-facebook-f text-xl"></i>
                </a>
                <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">
                  <i className="fab fa-linkedin-in text-xl"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Events</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Projects</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Membership</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Gallery</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Newsletter</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Podcasts</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">FAQ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 cursor-pointer">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-map-marker-alt mt-1 mr-3 text-orange-400"></i>
                  <span>1400 South Hayworth Ave, Suite 207, Los Angeles, CA 90035</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone mr-3 text-orange-400"></i>
                  <span>+1 (323) 297-3507</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope mr-3 text-orange-400"></i>
                  <span>info@dirbyaber.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Dirbyaber Community. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-300 cursor-pointer">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-300 cursor-pointer">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-300 cursor-pointer">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
