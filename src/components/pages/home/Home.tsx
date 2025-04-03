// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Hero from './Hero';
import LatestDeceased from './LatestDeceased';

const App: React.FC = () => {
  // Mock data for community highlights
  const communityHighlights = [
    {
      id: 1,
      title: 'Financial Assistance',
      description: 'Providing financial aid to families during the challenging time of a loved one\'s passing.',
      icon: 'fa-hand-holding-dollar'
    },
    {
      id: 2,
      title: 'Community Support',
      description: 'Fostering a supportive environment for families in need.',
      icon: 'fa-people-arrows'
    },
    {
      id: 3,
      title: 'Mission-Driven',
      description: 'Committed to alleviating financial burdens during difficult times.',
      icon: 'fa-heart'
    },
    {
      id: 4,
      title: 'Los Angeles Based',
      description: 'Serving families from our headquarters in Los Angeles, California.',
      icon: 'fa-city'
    }
  ];

  const latestDeceased = {
    name: 'DESSALEGN WOLDE MARIAM',
    dateOfPassing: 'April 1, 2025',
  };

  // Animation for elements when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeIn');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.initially-hidden');
    hiddenElements.forEach(el => observer.observe(el));

    return () => {
      hiddenElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navigation */}

      {/* Hero Section */}
      <Hero />

      {/* Main Header */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-500">
               የድር ቢያብር ዕድር መረዳጃ ማህበር ድህረ ገጽ
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 initially-hidden">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Dir Biyaber Edir</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Dir Biyaber Edir Mutual Assistance Association of Los Angeles is a nonprofit organization dedicated to supporting families during the challenging time of a loved one’s passing. 
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Headquartered at 1400 S Hayworth Avenue 207 in Los Angeles, CA 90035, our mission is to provide financial aid to cover funeral expenses, alleviating the financial burden on families during such difficult times.
              </p>
            </div>
            <div className="md:w-1/2 initially-hidden">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/images/officeArgawBelay.jpg" 
                  alt="Dirbyaber Community Members" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Deceased Section */}
      <LatestDeceased person={latestDeceased} />


      {/* Community Highlights */}
      <section id="highlights" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 initially-hidden">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Community Highlights</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Learn more about how Dir Biyaber Edir is making a difference by supporting families in need and fostering a sense of community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {communityHighlights.map((highlight, index) => (
              <div 
                key={highlight.id} 
                className="bg-gray-50 rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 initially-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-orange-500 mb-4">
                  <i className={`fas ${highlight.icon} text-4xl`}></i>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{highlight.title}</h3>
                <p className="text-gray-600">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 initially-hidden">Join Our Growing Community Today</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto initially-hidden">
            Become part of something meaningful.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 initially-hidden">
            <Link 
              to="/contact-us" 
              className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer !rounded-button whitespace-nowrap"
            >
              Become a Member
            </Link>
            <button 
              className="bg-transparent border-2 border-white hover:bg-white/10 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-300 cursor-pointer !rounded-button whitespace-nowrap"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}

      {/* CSS for animations */}
      <style>{`
        .initially-hidden {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .animate-fadeIn {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default App;

