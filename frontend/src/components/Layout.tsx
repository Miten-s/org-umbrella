import React from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Layout = ({ children, sidebarOpen, toggleSidebar }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1" >
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-1 p-4 bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
