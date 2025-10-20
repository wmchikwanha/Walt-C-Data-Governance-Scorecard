import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BuildingLibraryIcon, UserCircleIcon, ArrowRightOnRectangleIcon, BellIcon, EnvelopeIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { api } from '../../data';
import { AppNotification, UserRole } from '../../types';

const NotificationBell: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        if (user) {
            const userNotifications = await api.getNotificationsForUser(user.id);
            setNotifications(userNotifications);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev);
        if (!isOpen && unreadCount > 0) {
            // Mark visible notifications as read
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0 && user) {
                api.markNotificationsAsRead(user.id, unreadIds).then(() => {
                    // Refresh notifications to update read status visually
                    fetchNotifications();
                });
            }
        }
    }, [isOpen, unreadCount, notifications, user, fetchNotifications]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [popoverRef]);

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={handleToggle}
                className="relative text-gray-400 mr-4 hover:text-brand-primary transition-colors focus:outline-none"
                aria-label={`View notifications (${unreadCount} unread)`}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <BellIcon className="h-8 w-8" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white" aria-hidden="true">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20 animate-fadeInUp" role="region" aria-label="Notifications popover">
                    <div className="p-3 border-b font-semibold text-gray-700">Notifications</div>
                    <ul className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <li key={notif.id} className={`p-3 border-b hover:bg-slate-50 ${!notif.read ? 'bg-blue-50' : ''}`}>
                                    <p className="text-sm font-semibold text-gray-800">{notif.subject}</p>
                                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                    <div className="text-right text-xs text-gray-400 mt-2">
                                        from {notif.senderName} - {new Date(notif.timestamp).toLocaleDateString()}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="p-4 text-center text-sm text-gray-500">
                                <EnvelopeIcon className="h-8 w-8 mx-auto text-gray-300" aria-hidden="true" />
                                <p className="mt-2">You have no new notifications.</p>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for search logic. A real implementation would
        // likely involve context or routing to a search results page.
        alert(`Search functionality not implemented. You searched for: "${query}"`);
    };

    return (
        <div className="w-full max-w-lg lg:max-w-xs">
            <form onSubmit={handleSearch} className="relative">
                <label htmlFor="search" className="sr-only">
                    Search
                </label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-brand-primary focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm transition-colors"
                    placeholder="Search users, templates..."
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </form>
        </div>
    );
};


const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const showSearch = user?.role === UserRole.ADMINISTRATOR || user?.role === UserRole.SENIOR_MANAGEMENT;


  return (
    <header className="bg-white shadow-md no-print">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <BuildingLibraryIcon className="h-8 w-8 text-brand-primary" aria-hidden="true" />
            <span className="ml-3 text-xl font-bold text-gray-800 hidden sm:inline">Data Governance Scorecard</span>
          </div>
          <div className="flex items-center">
            {showSearch && (
                <div className="hidden md:block mr-6">
                    <GlobalSearch />
                </div>
            )}

            {user && (
              <>
                {user.role === UserRole.ADMINISTRATOR && (
                    <Link to="/" aria-label="Admin Panel" className="text-gray-400 mr-4 hover:text-brand-primary transition-colors">
                        <ShieldCheckIcon className="h-8 w-8" />
                    </Link>
                )}
                <NotificationBell />
                <div className="text-right mr-4">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 hidden md:block">{user.role}{user.departmentName ? ` - ${user.departmentName}` : ''}</p>
                </div>
                <Link to="/profile" aria-label="View your profile">
                    <UserCircleIcon className="h-8 w-8 text-gray-400 mr-4 hover:text-brand-primary transition-colors" />
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors"
                  aria-label="Sign Out"
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
