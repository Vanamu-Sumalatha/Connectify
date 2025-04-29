import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

// Import the sidebar dynamically to handle import errors
const AdminSidebar = React.lazy(() => import('../components/sidebar/AdminSidebar'));

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

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="fixed top-0 left-0 w-64 h-screen bg-gray-100">Loading sidebar...</div>}>
        <ErrorBoundary>
          <AdminSidebar onCollapseChange={setIsSidebarCollapsed} />
        </ErrorBoundary>
      </Suspense>
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

export default AdminLayout; 