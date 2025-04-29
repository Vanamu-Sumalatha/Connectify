import React from 'react';

const StudentChatRooms = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold">Student Chat Rooms</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Chat Rooms List */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Available Chat Rooms</h2>
            <div className="space-y-4">
              {/* Add your chat rooms list here */}
            </div>
          </div>

          {/* Statistics */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">My Chat Rooms</h2>
            <div className="space-y-4">
              {/* Add your statistics here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentChatRooms; 