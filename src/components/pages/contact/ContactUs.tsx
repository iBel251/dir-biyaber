// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React from 'react';
import ContactForm from './ContactForm';

const App: React.FC = () => {
  // Social media links data
  const socialLinks = [
    { name: 'Facebook', icon: 'fa-facebook-f' },
    { name: 'Twitter', icon: 'fa-twitter' },
    { name: 'Instagram', icon: 'fa-instagram' },
    { name: 'LinkedIn', icon: 'fa-linkedin-in' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="relative mb-16 rounded-xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-90"></div>
          <img 
            src="https://public.readdy.ai/ai/img_res/52c51849ebb59fc14dbedb03763c6e20.jpg" 
            alt="Contact Us Hero" 
            className="w-full h-64 object-cover object-top"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center px-8 md:px-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Contact Us</h1>
            <p className="text-white text-lg md:text-xl max-w-2xl text-center">We'd love to hear from you. Reach out to our team with any questions, feedback, or inquiries you may have.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
          
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <i className="fas fa-envelope text-indigo-600"></i>
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium">Email</h3>
                    <a href="mailto:contact@dirbyaber.com" className="text-indigo-600 hover:text-indigo-800 transition duration-300">contact@dirbyaber.com</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <i className="fas fa-phone-alt text-indigo-600"></i>
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium">Phone</h3>
                    <a href="tel:+13232973507" className="text-indigo-600 hover:text-indigo-800 transition duration-300">+1 (323) 297-3507</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <i className="fas fa-clock text-indigo-600"></i>
                  </div>
                  <div>
                    <h3 className="text-gray-600 font-medium">Business Hours</h3>
                    <p className="text-gray-700">Monday - Friday: 9AM - 5PM</p>
                    <p className="text-gray-700">Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Follow Us</h2>
              <div className="flex justify-center space-x-4">
                {socialLinks.map((link, index) => (
                  <a 
                    key={index}
                    href="#" 
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 p-3 rounded-full transition duration-300 cursor-pointer"
                    aria-label={link.name}
                  >
                    <i className={`fab ${link.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Map Section */}
        <div className="mt-16 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Our Location</h2>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3303.926457123456!2d-118.371123456!3d34.056123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2b1234567890!2s1400%20S%20Hayworth%20Ave%20Suite%20207%2C%20Los%20Angeles%2C%20CA%2090035!5e0!3m2!1sen!2sus!4v1691234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-700">1400 South Hayworth Ave, Suite 207, Los Angeles, CA 90035</p>
          </div>
        </div>
      </main>
      
      <style>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
          }
          
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
          }
          
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default App;

