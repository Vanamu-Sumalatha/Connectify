import React from 'react';

const Settings = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              {/* Add your general settings here */}
            </div>
          </div>

          {/* System Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">System Settings</h2>
            <div className="space-y-4">
              {/* Add your system settings here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 