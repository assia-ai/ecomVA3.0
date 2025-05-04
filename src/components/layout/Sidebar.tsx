import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Plug, 
  Settings as SettingsIcon, 
  CreditCard, 
  ClipboardList,
  Lock,
  Mail,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/Logo EcomVA avec icône de boîtes.png';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const navigation = [
    { name: t('sidebar.dashboard'), href: '/app/dashboard', icon: Home },
    { name: t('sidebar.integrations'), href: '/app/integrations', icon: Plug },
    { name: t('sidebar.preferences'), href: '/app/preferences', icon: SettingsIcon },
    // { name: t('sidebar.billing'), href: '/app/billing', icon: CreditCard },
    { name: t('sidebar.activityLog'), href: '/app/activity', icon: ClipboardList },
    { name: t('sidebar.settings'), href: '/app/settings', icon: Lock }
  ];

  return (
    <div className="w-64 h-full bg-white flex flex-col">
      {/* Close button - mobile only */}
      {onClose && (
        <button
          className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label={t('common.closeSidebar')}
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="EcomVA Logo" className="h-6 w-6" />
          <span className="text-xl font-semibold text-gray-900">EcomVA</span>
        </div>
      </div>

      {/* User Info */}
      {userProfile && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-medium">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 truncate">
                {userProfile.name || t('common.user')}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {userProfile.email}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {userProfile.plan === 'pro' ? t('sidebar.proPlan') : t('sidebar.freePlan')}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => cn(
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all'
            )}
            onClick={() => onClose && onClose()}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    isActive
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>© 2025 EcomVA</p>
          <p>v0.1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;