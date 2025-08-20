import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faUserShield, faPlus, faAddressBook } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Button from '../ui/Button';

interface HeaderProps {
  user?: {
    displayName?: string;
    email: string;
    isAdmin: boolean;
  };
  onLogin: () => void;
  onLogout: () => void;
  onAddRoleForSelf?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, onAddRoleForSelf }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            RRIS Academic Directory
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/contacts" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FontAwesomeIcon icon={faAddressBook} className="h-4 w-4" />
              <span>Contacts</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                <span>{user.displayName || user.email}</span>
                {user.isAdmin && (
                  <FontAwesomeIcon 
                    icon={faUserShield} 
                    className="h-4 w-4 text-blue-600" 
                    title="Admin"
                  />
                )}
              </div>
              
              {onAddRoleForSelf && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={faPlus}
                  onClick={onAddRoleForSelf}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hidden sm:flex"
                >
                  Add Role
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                icon={faSignOutAlt}
                onClick={onLogout}
                className="sm:px-4 px-2"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={faUser}
              onClick={onLogin}
            >
              Admin Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;