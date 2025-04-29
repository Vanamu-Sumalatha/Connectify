import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { StudentProvider } from './context/StudentContext';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/index';
import TakeTest from './pages/student/Certification Tests/TakeTest.jsx';

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StudentProvider>
            <Toaster position="top-right" />
            <AppRouter />
          </StudentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
};

export default App; 