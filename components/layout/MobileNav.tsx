'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faTimes, 
  faHome, 
  faAddressBook, 
  faUserShield, 
  faUsers, 
  faGraduationCap,
  faSignOutAlt,
  faUser,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

interface MobileNavProps {
  user?: {
    displayName?: string;
    email: string;
    isAdmin: boolean;
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onAddRoleForSelf?: () => void;
  userDashboard?: {
    dashboardType: 'head' | 'coordinator' | 'rep' | 'public';
    showMultipleDashboards?: boolean;
  };
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  user, 
  onLogin, 
  onLogout, 
  onAddRoleForSelf,
  userDashboard 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    closeMenu();
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    {
      icon: faAddressBook,
      label: 'Contacts',
      path: '/contacts',
      show: true
    },
    {
      icon: faHome,
      label: 'Dashboard',
      path: '/',
      show: true
    }
  ];

  // Add admin-specific nav items
  if (user?.isAdmin) {
    navItems.push({
      icon: faUserShield,
      label: 'Admin Panel',
      path: '/#admin',
      show: userDashboard?.dashboardType === 'head'
    });
  }

  // Add coordinator dashboard if applicable
  if (userDashboard?.showMultipleDashboards) {
    navItems.push({
      icon: faUsers,
      label: 'My Coordinator View',
      path: '/#coordinator',
      show: true
    });
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link href="/" className="text-lg font-bold text-gray-900">
            RRIS Directory
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            <FontAwesomeIcon 
              icon={isOpen ? faTimes : faBars} 
              className="h-5 w-5" 
            />
          </button>
        </div>
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden transition-opacity duration-300 ease-out"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Dropdown Menu */}
      <div className={`md:hidden fixed top-[60px] left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-40 transition-all duration-300 ease-out transform ${
        isOpen 
          ? 'opacity-100 translate-y-0 max-h-screen' 
          : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden'
      }`}>
        {/* Navigation Items */}
        <div className="py-3">
          {navItems.filter(item => item.show).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <FontAwesomeIcon 
                icon={item.icon} 
                className={`h-5 w-5 mr-4 ${
                  isActive(item.path) ? 'text-blue-600' : 'text-gray-400'
                }`} 
              />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* User Section */}
        {user && (
          <div className="border-t border-gray-200 bg-gray-50">
            {/* User Info */}
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.displayName || user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  {user.isAdmin && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                      <FontAwesomeIcon icon={faUserShield} className="h-3 w-3 mr-1" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="bg-white border-t border-gray-200">
              {onAddRoleForSelf && (
                <button
                  onClick={() => {
                    onAddRoleForSelf();
                    closeMenu();
                  }}
                  className="w-full flex items-center px-6 py-4 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-5 w-5 mr-4 text-gray-400" />
                  <span className="font-medium">Add Role</span>
                </button>
              )}

              <button
                onClick={() => {
                  onLogout?.();
                  closeMenu();
                }}
                className="w-full flex items-center px-6 py-4 text-left text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors border-t border-gray-100"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5 mr-4 text-red-500" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Login Button for non-authenticated users */}
        {!user && onLogin && (
          <div className="border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                onLogin();
                closeMenu();
              }}
              className="w-full flex items-center px-6 py-4 text-left text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-4 text-blue-500" />
              <span className="font-medium">Admin Login</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileNav;