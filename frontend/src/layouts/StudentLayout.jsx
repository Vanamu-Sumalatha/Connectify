import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { BookOpenIcon } from '@heroicons/react/24/outline';

// Import the sidebar dynamically to handle import errors
const StudentSidebar = React.lazy(() => import('../components/sidebar/StudentSidebar'));

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
          <h3 className="font-bold">Something went wrong with the sidebar.</h3>
          <p className="text-sm mt-1">The application will continue to function, but the navigation may be limited.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const StudentLayout = () => {
    const { student, loading: studentLoading } = useStudent();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Show loading while either context is loading
    if (authLoading || studentLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated but not a student, redirect to appropriate dashboard
    if (user.role !== 'student') {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    // Even if student data isn't fully loaded, we can still show the layout
    // with the user data we have from authentication
    return (
        <div className="min-h-screen bg-background">
            <React.Suspense fallback={<div className="fixed top-0 left-0 w-64 h-screen bg-gray-100">Loading sidebar...</div>}>
                <ErrorBoundary>
                    <StudentSidebar onCollapseChange={setIsSidebarCollapsed} />
                </ErrorBoundary>
            </React.Suspense>
            <div 
                className={`transition-all duration-300 ${
                    isSidebarCollapsed ? 'ml-16' : 'ml-64'
                }`}
            >
                <main className="p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StudentLayout; 