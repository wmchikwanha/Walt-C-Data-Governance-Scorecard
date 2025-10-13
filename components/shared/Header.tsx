import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BuildingLibraryIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <BuildingLibraryIcon className="h-8 w-8 text-brand-primary" />
            <span className="ml-3 text-xl font-bold text-gray-800">Data Governance Scorecard</span>
          </div>
          <div className="flex items-center">
            {user && (
              <>
                <div className="text-right mr-4">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}{user.departmentName ? ` - ${user.departmentName}` : ''}</p>
                </div>
                <Link to="/profile" title="View Profile">
                    <UserCircleIcon className="h-8 w-8 text-gray-400 mr-4 hover:text-brand-primary transition-colors" />
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors"
                  title="Sign Out"
                >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
