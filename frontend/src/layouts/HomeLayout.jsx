import React from 'react';
import { Outlet } from 'react-router-dom';

const HomeLayout = () => {
  return (
    <div className="home-layout">
      <Outlet />
    </div>
  );
};

export default HomeLayout; 