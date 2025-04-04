// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState } from 'react';

const App: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setError('Invalid credentials. Please try again.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url('https://public.readdy.ai/ai/img_res/fac726554d7fc425403f5a409a091156.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://public.readdy.ai/ai/img_res/167007b307886de4dfffd5a874643264.jpg" 
              alt="Company Logo" 
              className="h-16 object-contain"
            />
          </div>
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
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center mb-1">
                    <div className="text-xs text-gray-600 mr-2">Password strength:</div>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          passwordStrength === 0 ? 'bg-red-500' :
                          passwordStrength === 1 ? 'bg-orange-500' :
                          passwordStrength === 2 ? 'bg-yellow-500' :
                          passwordStrength === 3 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      <i className={`fas fa-${password.length >= 8 ? 'check' : 'times'} mr-1`}></i>
                      At least 8 characters
                    </span>
                    <span className="mx-2">•</span>
                    <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      <i className={`fas fa-${/[A-Z]/.test(password) ? 'check' : 'times'} mr-1`}></i>
                      Uppercase
                    </span>
                    <span className="mx-2">•</span>
                    <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      <i className={`fas fa-${/[0-9]/.test(password) ? 'check' : 'times'} mr-1`}></i>
                      Number
                    </span>
                    <span className="mx-2">•</span>
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      <i className={`fas fa-${/[^A-Za-z0-9]/.test(password) ? 'check' : 'times'} mr-1`}></i>
                      Special character
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
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
          
          <div className="text-xs text-gray-500">
            <span>Need help? </span>
            <a href="#" className="text-blue-600 hover:underline">Contact IT Support</a>
            <span> • </span>
            <span>© {new Date().getFullYear()} Company Name. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

