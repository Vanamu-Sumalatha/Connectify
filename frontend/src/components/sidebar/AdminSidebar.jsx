import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BellIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Logout from '../../pages/admin/Logout';

const AdminSidebar = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Update parent component when sidebar state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Courses', href: '/admin/courses', icon: BookOpenIcon },
    { name: 'Chat Rooms', href: '/admin/chat-rooms', icon: ChatBubbleLeftRightIcon },
    { name: 'Assignments', href: '/admin/assignments', icon: DocumentTextIcon },
    { name: 'Certificates', href: '/admin/certificates', icon: AcademicCapIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`fixed top-0 left-0 h-screen ${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 flex flex-col z-10`}>
      {/* Fixed Header */}
      <div className="p-4 border-b bg-blue-600 text-white flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">Admin Panel</h1>}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-blue-700 focus:outline-none transition-colors"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-white" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className={`w-5 h-5 ${!isCollapsed && 'mr-3'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Fixed Logout Button */}
      <div className="p-4 border-t bg-white">
        {!isCollapsed ? (
          <Logout />
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Call the logout function from the Logout component
                // This is a simple workaround; you might need to access the logout function directly
                document.querySelector('.logout-button')?.click();
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
              title="Logout"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar; 