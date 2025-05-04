import React from 'react';
import { BellIcon, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LanguageSelector from '../ui/LanguageSelector';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success(t('auth.logoutSuccess'));
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error(t('auth.logoutError'));
    }
  };

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('/app/dashboard')) return t('navigation.dashboard');
    if (path.includes('/app/integrations')) return t('navigation.integrations');
    if (path.includes('/app/preferences')) return t('navigation.preferences');
    if (path.includes('/app/billing')) return t('navigation.billing');
    if (path.includes('/app/activity')) return t('navigation.activityLog');
    if (path.includes('/app/settings')) return t('navigation.settings');
    return '';
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="px-4 md:px-6 h-full flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="p-1.5 mr-3 text-gray-500 rounded-md hover:bg-gray-100 lg:hidden"
            onClick={onMenuClick}
            aria-label={t('common.openMenu')}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <LanguageSelector />
          <button 
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t('common.notifications')}
          >
            <BellIcon className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center px-1.5 py-1 md:px-3 md:py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-0 md:mr-1.5" />
            <span className="hidden md:inline">{t('auth.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;