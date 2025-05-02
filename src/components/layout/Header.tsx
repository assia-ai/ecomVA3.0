import React from 'react';
import { BellIcon, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out');
    }
  };

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('/app/dashboard')) return 'Dashboard';
    if (path.includes('/app/integrations')) return 'Integrations';
    if (path.includes('/app/preferences')) return 'Preferences';
    if (path.includes('/app/billing')) return 'Billing';
    if (path.includes('/app/activity')) return 'Activity Log';
    if (path.includes('/app/settings')) return 'Settings';
    return '';
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="p-1.5 mr-3 text-gray-500 rounded-md hover:bg-gray-100 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <button 
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center px-1.5 py-1 md:px-3 md:py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-0 md:mr-1.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;