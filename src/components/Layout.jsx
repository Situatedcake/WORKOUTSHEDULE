// components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Menu from './Menu';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-24">
        <Outlet />
      </main>
      <Menu />
    </div>
  );
};

export default Layout;