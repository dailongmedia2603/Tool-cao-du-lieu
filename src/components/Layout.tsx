import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '@/hooks/use-sidebar';
import { Session } from '@supabase/supabase-js';

interface LayoutProps {
  children: React.ReactNode;
  session: Session;
}

const Layout = ({ children, session }: LayoutProps) => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ background: 'radial-gradient(circle at 100% 0, rgba(255, 244, 236, 0.5) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(255, 244, 236, 0.3) 0%, transparent 50%)' }}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;