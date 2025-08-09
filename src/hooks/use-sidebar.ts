import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'sidebar-collapsed';

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return { isCollapsed, toggleSidebar };
};