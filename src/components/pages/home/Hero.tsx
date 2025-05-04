import React from "react";
import { Link } from "react-router-dom";

const Hero: React.FC<{ language: string }> = ({ language }) => {
  return (
    <section className="relative flex items-center justify-center overflow-hidden" style={{
      height: 'calc(100vh - 3.5rem)', // Adjust height to account for the nav
      backgroundImage: `url('/images/officeNew.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'brightness(1.2)' // Increase brightness
    }}>
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/30" style={{
        opacity: 0.6 // Decrease overlay opacity
      }}></div>
      <div className="absolute" style={{
        top: '65%', // Explicitly move down
        left: '-10%', // Keep it aligned to the left
        width: '100%',
        height: '100%',
        backgroundImage: `url('/images/flag.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        opacity: 0.7,
        position: 'absolute',
        transform: 'translateY(-50%)' // Adjust for centering
      }}></div>
      <div className="absolute" style={{
        top: '65%', // Explicitly move down
        right: '-50%', // Keep it aligned to the left
        width: '100%',
        height: '100%',
        backgroundImage: `url('/images/flag2.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        opacity: 0,
        position: 'absolute',
        transform: 'translateY(-50%)' // Adjust for centering
      }}></div>
      <div className="relative z-1 text-center px-4 max-w-5xl mx-auto">
        <h1 className="amharic-text text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{
          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.7)'
        }}>
          {language === "en"
            ? "Dir Biyaber Edir Mutual Assistance Association"
            : "ድር ቢያብር የጋራ መረዳጃ ማህበር"}
        </h1>
        <p className="amharic-text text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto animate-slide-up" style={{
          textShadow: '1px 1px 4px rgba(0, 0, 0, 0.6)'
        }}>
          {language === "en" ? "Los Angeles, California" : "ሎስ አንጀለስ ካሊፎርኒያ"}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/about" 
            className="amharic-text bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 cursor-pointer !rounded-button whitespace-nowrap"
          >
            {language === "en" ? "Learn More" : "ተጨማሪ መረጃ"}
          </Link>
          <Link 
            to="/member-registration" 
            className="amharic-text bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-300 cursor-pointer !rounded-button whitespace-nowrap"
          >
            {language === "en" ? "Update Member Profile " : "የአባላት መረጃ መሰብሰቢያ"}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
