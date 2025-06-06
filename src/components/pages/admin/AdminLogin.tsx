// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { login, getCurrentUser, resetPassword } from '../../../firebase/authService'; // Import the login function, getCurrentUser, and resetPassword

const App: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const user = getCurrentUser(); // Check if the user is already logged in
    if (user) {
      navigate('/portal'); // Redirect to /portal if logged in
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
        setError('Please fill in all fields');
        return;
    }
    
    setIsLoading(true);
    
    try {
        await login(email, password); // Call the login function
        console.log('Login successful');
        navigate('/portal'); // Navigate to /portal on success
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            setError('No user found with this email.');
        } else if (error.code === 'auth/wrong-password') {
            setError('Incorrect password. Please try again.');
        } else if (error.code === 'auth/too-many-requests') {
            setError('Too many login attempts. Please try again later.');
        } else if (error.code === 'auth/invalid-email') {
            setError('Invalid email format. Please check and try again.');
        } else if (error.code === 'auth/invalid-credential') {
            setError('Invalid email or password. Please check your credentials and try again.');
        } else {
            setError('An error occurred. Please check your inputs and try again.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetMessage('');
    if (!resetEmail) {
        setResetMessage('Please enter your email address.');
        return;
    }
    try {
        await resetPassword(resetEmail);
        setResetMessage('If an account with this email exists, a password reset email has been sent.');
    } catch (error: any) {
        if (error.code === 'auth/invalid-email') {
            setResetMessage('Invalid email format. Please check and try again.');
        } else {
            setResetMessage('An error occurred. Please check your inputs and try again.');
        }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 pt-24"> {/* Adjusted pt-24 for spacing */}
      <div 
        className="absolute z-0" /* Add z-0 so the background stays behind the nav */
        style={{
          backgroundImage: `url('https://public.readdy.ai/ai/img_res/fac726554d7fc425403f5a409a091156.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="w-full max-w-md"> {/* Remove z-10 so it doesn't overlap the nav */}
        <div className="mb-8 text-center">
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Board Members Portal</h1>
          <p className="text-gray-600">Restricted Access — Board Members Only</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgot password?
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 !rounded-button whitespace-nowrap cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Logging in...
                </span>
              ) : (
                'Sign in to Portal'
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center space-x-4 mb-4">
            <div className="flex items-center text-gray-600 text-sm">
              <i className="fas fa-shield-alt text-gray-500 mr-1"></i>
              <span>Secure Connection</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <i className="fas fa-lock text-gray-500 mr-1"></i>
              <span>Encrypted</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <i className="fas fa-user-shield text-gray-500 mr-1"></i>
              <span>Protected</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">
            This portal is monitored and secured. Unauthorized access attempts will be logged.
          </p>
        </div>
      </div>

      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Reset Password</h2>
            {resetMessage && (
              <div className={`p-3 rounded-md mb-4 text-sm ${resetMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {resetMessage}
              </div>
            )}
            <input
              type="email"
              className="block w-full p-2 border border-gray-300 rounded-md mb-4"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md text-sm"
                onClick={() => setIsForgotPasswordOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                onClick={handleForgotPassword}
              >
                Send Reset Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

