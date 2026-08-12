import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // Import useLocation
import Navigation from './components/Navigation';
import Home from './components/pages/home/Home';
import About from './components/pages/about/About';
import ContactUs from './components/pages/contact/ContactUs'; // Import the ContactUs component
import Obituary from './components/pages/obituary/Obituary'; // Import the Obituary component
import Bylaws from './components/pages/bylaws/bylaws'; // Import the Bylaws component
import Admin from './components/pages/admin/AdminLogin'; // Import the Admin component
import Footer from './components/Footer';
import Portal from './components/pages/admin/Portal';
import Posts from './components/pages/blogs/Posts'; // Import the Posts component
import Announcement from './components/pages/announcements/announcement';
import Forms from './components/pages/forms/Forms'; // Import the Forms component
import MemberRegistrationPage from './components/pages/memberRegistration/MemberRegistrationPage' // Import the Member Registration component
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css'; // Import the CSS file for styling

function App() {
  const [language, setLanguage] = useState(localStorage.getItem("preferredLanguage") || "en"); // Initialize with persisted language

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang); // Persist language
  };

  const ScrollToTop = () => {
    const location = useLocation(); // Get the current location
    const [prevLocation, setPrevLocation] = useState(location);

    useEffect(() => {
      if (location.pathname !== prevLocation.pathname) { // Only scroll on route change
        window.scrollTo(0, 0);
      }
      setPrevLocation(location); // Update previous location
    }, [location, prevLocation]); // Run effect when location changes

    return null; // This component doesn't render anything
  };

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/portal" element={<Portal />} />
        <Route
          path="*"
          element={
            <div className="App">
              <Navigation onLanguageChange={handleLanguageChange} />
              <div className="content">
                <Routes>
                  <Route path="/" element={<Home language={language}/>} /> {/* Home route */}
                  <Route path="/blogs" element={<Posts language={language} />} /> {/* Add Blogs route */}
                  <Route path="/about" element={<About language={language} />} /> {/* Pass language to About */}
                  <Route path="/contact-us" element={<ContactUs />} /> {/* Contact Us route */}
                  <Route path="/obituary" element={<Obituary />} /> {/* Obituary route */}
                  <Route path="/bylaws" element={<Bylaws />} /> {/* Bylaws route */}
                  <Route path="/adminLogin" element={<Admin />} /> {/* Admin route */}
                  <Route path="/announcement" element={<Announcement language={language} />} /> {/* Announcement route */}
                  <Route path="/forms" element={<Forms language={language} />} /> {/* Forms route with language prop */}
                  <Route path="/member-registration" element={<MemberRegistrationPage />} /> {/* Member Registration route */}
                </Routes>
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
