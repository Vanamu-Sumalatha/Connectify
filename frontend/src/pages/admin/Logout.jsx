import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const Logout = ({ isCollapsed }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center w-full p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      title={isCollapsed ? 'Logout' : ''}
    >
      <ArrowLeftOnRectangleIcon className="w-6 h-6" />
      {!isCollapsed && <span className="ml-4">Logout</span>}
    </button>
  );
};

export default Logout; 