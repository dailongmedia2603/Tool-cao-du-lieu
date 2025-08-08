import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ background: 'radial-gradient(circle at 100% 0, rgba(255, 244, 236, 0.5) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255, 244, 236, 0.3) 0%, transparent 50%)' }}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      <div className="fixed bottom-8 right-8 z-10">
        <Button className="bg-brand-orange hover:bg-brand-orange/90 rounded-full h-14 w-14 shadow-lg">
          <MessageCircle className="h-7 w-7 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default Layout;