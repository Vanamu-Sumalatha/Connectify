import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ConnectifyLogo = () => {
  return (
    <div className="flex items-center space-x-2">
      <motion.svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={{ scale: 1.05 }}
        className="text-vibrant-blue"
      >
        {/* Outer Circle */}
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Connected Nodes */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Center Node */}
          <circle cx="20" cy="20" r="4" fill="currentColor" />
          
          {/* Surrounding Nodes */}
          <circle cx="12" cy="20" r="3" fill="currentColor" />
          <circle cx="28" cy="20" r="3" fill="currentColor" />
          <circle cx="20" cy="12" r="3" fill="currentColor" />
          <circle cx="20" cy="28" r="3" fill="currentColor" />
        </motion.g>
        
        {/* Connection Lines */}
        <motion.g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <line x1="15" y1="20" x2="25" y2="20" />
          <line x1="20" y1="15" x2="20" y2="25" />
        </motion.g>
      </motion.svg>
      
      <div>
        <motion.span 
          className="text-2xl font-bold bg-gradient-to-r from-vibrant-blue to-vibrant-blue-dark inline-block text-transparent bg-clip-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          Connectify
        </motion.span>
      </div>
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <ConnectifyLogo />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.a 
              href="#" 
              className="text-vibrant-blue-text hover:text-vibrant-blue font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Home
            </motion.a>
            <motion.a 
              href="#" 
              className="text-vibrant-blue-text hover:text-vibrant-blue font-medium"
              whileHover={{ scale: 1.05 }}
            >
              About
            </motion.a>
            <motion.a 
              href="#" 
              className="text-vibrant-blue-text hover:text-vibrant-blue font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Domains
            </motion.a>
            <motion.a 
              href="#" 
              className="text-vibrant-blue-text hover:text-vibrant-blue font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Events
            </motion.a>
            <motion.a 
              href="#" 
              className="text-vibrant-blue-text hover:text-vibrant-blue font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Contact
            </motion.a>
          </div>

          {/* Right-side Buttons - Conditional rendering based on auth state */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <motion.button 
                    className="text-vibrant-blue hover:text-vibrant-blue-dark font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button 
                    className="bg-vibrant-blue text-white px-6 py-2 rounded-lg hover:bg-vibrant-blue-dark transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </>
            ) : (
              <>
                {user?.role === 'admin' ? (
                  <Link to="/admin/dashboard">
                    <motion.button 
                      className="text-vibrant-blue hover:text-vibrant-blue-dark font-medium"
                      whileHover={{ scale: 1.05 }}
                    >
                      Dashboard
                    </motion.button>
                  </Link>
                ) : (
                  <Link to="/student/dashboard">
                    <motion.button 
                      className="text-vibrant-blue hover:text-vibrant-blue-dark font-medium"
                      whileHover={{ scale: 1.05 }}
                    >
                      Dashboard
                    </motion.button>
                  </Link>
                )}
                <motion.button 
                  onClick={handleLogout}
                  className="bg-vibrant-blue text-white px-6 py-2 rounded-lg hover:bg-vibrant-blue-dark transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-vibrant-blue-text hover:text-vibrant-blue"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#" className="block px-3 py-2 rounded-md text-vibrant-blue-text hover:text-vibrant-blue hover:bg-gray-50">Home</a>
            <a href="#" className="block px-3 py-2 rounded-md text-vibrant-blue-text hover:text-vibrant-blue hover:bg-gray-50">About</a>
            <a href="#" className="block px-3 py-2 rounded-md text-vibrant-blue-text hover:text-vibrant-blue hover:bg-gray-50">Domains</a>
            <a href="#" className="block px-3 py-2 rounded-md text-vibrant-blue-text hover:text-vibrant-blue hover:bg-gray-50">Events</a>
            <a href="#" className="block px-3 py-2 rounded-md text-vibrant-blue-text hover:text-vibrant-blue hover:bg-gray-50">Contact</a>
            <div className="pt-4 space-y-2">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="block">
                    <button className="w-full px-3 py-2 text-center text-vibrant-blue hover:text-vibrant-blue-dark font-medium">
                      Login
                    </button>
                  </Link>
                  <Link to="/register" className="block">
                    <button className="w-full px-3 py-2 text-center bg-vibrant-blue text-white rounded-lg hover:bg-vibrant-blue-dark">
                      Sign Up
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  {user?.role === 'admin' ? (
                    <Link to="/admin/dashboard" className="block">
                      <button className="w-full px-3 py-2 text-center text-vibrant-blue hover:text-vibrant-blue-dark font-medium">
                        Dashboard
                      </button>
                    </Link>
                  ) : (
                    <Link to="/student/dashboard" className="block">
                      <button className="w-full px-3 py-2 text-center text-vibrant-blue hover:text-vibrant-blue-dark font-medium">
                        Dashboard
                      </button>
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-center bg-vibrant-blue text-white rounded-lg hover:bg-vibrant-blue-dark"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar; 