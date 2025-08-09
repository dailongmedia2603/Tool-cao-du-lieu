import { NavLink } from 'react-router-dom';
import { KeyRound, Settings, LayoutDashboard } from 'lucide-react';
import React from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/api-keys', label: 'API Keys', icon: KeyRound },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-col hidden md:flex">
      <div className="p-6 flex items-center space-x-2">
        <div className="w-8 h-8 bg-brand-orange rounded-lg"></div>
        <h1 className="text-xl font-bold text-gray-800">My App</h1>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-orange-light text-brand-orange'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;