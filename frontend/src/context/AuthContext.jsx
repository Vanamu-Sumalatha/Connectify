import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl } from '../config.js';

const API_URL = baseUrl;
const API_BASE = `${API_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increase timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Match the backend CORS configuration
});

// Check if the backend server is running
const checkServerStatus = async () => {
  try {
    // Use direct URL to avoid any issues with API_BASE composition
    const healthEndpoint = `${baseUrl}/api/health`;
    console.log('Checking server health at:', healthEndpoint);
    
    await axios.get(healthEndpoint, { 
      timeout: 15000,
      withCredentials: false,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Backend server is running');
    return true;
  } catch (error) {
    console.error('Backend server is not running or not accessible:', error);
    toast.error('Cannot connect to the server. Please make sure the backend is running.');
    return false;
  }
};

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Auth API Request:', `${config.method.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  error => {
    console.error('Auth API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log('Auth API Response:', response.status, response.data);
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('Auth API Timeout Error: Request took too long to complete');
      toast.error('Server request timed out. Please check if the backend server is running.');
    } else {
      console.error('Auth API Response Error:', 
        error.response ? 
          `${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}` : 
          error.message
      );
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
  });
  const [serverIsRunning, setServerIsRunning] = useState(true);

  // Check if the server is running when component mounts
  useEffect(() => {
    const checkServer = async () => {
      const isRunning = await checkServerStatus();
      setServerIsRunning(isRunning);
    };
    checkServer();
  }, []);

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      if (!serverIsRunning) {
        throw new Error('Server not available');
      }
      
      const response = await api.get('/auth/verify');
      setAuthState({
        user: response.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [serverIsRunning]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = useCallback(async (email, password) => {
    try {
      if (!serverIsRunning) {
        throw new Error('Server not available');
      }
      
      // First attempt a quick server health check
      await checkServerStatus();
      
      // Log the exact request being made
      console.log('Login request:', { email, password });
      
      // Make sure email and password are strings
      const emailStr = String(email).trim();
      const passwordStr = String(password);
      
      const response = await api.post('/auth/login', { 
        email: emailStr, 
        password: passwordStr 
      });
      
      console.log('Login response:', response.data);
      
      const { token, ...user } = response.data;
      localStorage.setItem('token', token);
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Login successful!');
      return user;
    } catch (error) {
      console.error('Login error details:', error);
      if (error.message === 'Server not available') {
        toast.error('Server is not available. Please check if the backend is running.');
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  }, [serverIsRunning]);

  const register = useCallback(async (userData) => {
    try {
      if (!serverIsRunning) {
        throw new Error('Server not available');
      }
      
      // First attempt a quick server health check
      await checkServerStatus();
      
      const response = await api.post('/auth/register', userData);
      const { token, ...user } = response.data;
      localStorage.setItem('token', token);
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Registration successful!');
      return user;
    } catch (error) {
      if (error.message === 'Server not available') {
        toast.error('Server is not available. Please check if the backend is running.');
      } else {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
      throw error;
    }
  }, [serverIsRunning]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      if (!serverIsRunning) {
        throw new Error('Server not available');
      }
      
      const response = await api.put('/users/profile', profileData);
      setAuthState(prev => ({
        ...prev,
        user: response.data,
      }));
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error) {
      if (error.message === 'Server not available') {
        toast.error('Server is not available. Please check if the backend is running.');
      } else {
        toast.error(error.response?.data?.message || 'Profile update failed');
      }
      throw error;
    }
  }, [serverIsRunning]);

  const value = useMemo(
    () => ({
      ...authState,
      login,
      register,
      logout,
      updateProfile,
      serverIsRunning,
    }),
    [authState, login, register, logout, updateProfile, serverIsRunning]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 