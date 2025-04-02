import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import routing components
import Navigation from './components/Navigation';
import Home from './components/pages/home/Home';
import About from './components/pages/about/About';
import ContactUs from './components/pages/contact/ContactUs'; // Import the ContactUs component
import Obituary from './components/pages/obituary/Obituary'; // Import the Obituary component
import Bylaws from './components/pages/bylaws/bylaws'; // Import the Bylaws component
import Footer from './components/Footer';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css'; // Import the CSS file for styling

function App() {
  const [language, setLanguage] = useState(localStorage.getItem("preferredLanguage") || "en"); // Initialize with persisted language

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang); // Persist language
  };

  return (
    <Router>
      <div className="App">
        <Navigation onLanguageChange={handleLanguageChange} />
        <div className="content"> {/* Add a wrapper with a class */}
          <Routes>
            <Route path="/" element={<Home />} /> {/* Home route */}
            <Route path="/about" element={<About language={language} />} /> {/* Pass language to About */}
            <Route path="/contact-us" element={<ContactUs />} /> {/* Contact Us route */}
            <Route path="/obituary" element={<Obituary />} /> {/* Obituary route */}
            <Route path="/bylaws" element={<Bylaws />} /> {/* Bylaws route */}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
