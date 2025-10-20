
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { api } from '../data';
import { BuildingLibraryIcon, UserCircleIcon } from '@heroicons/react/24/solid';

const LoginPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { login } = useAuth();

  useEffect(() => {
    api.getUsers().then(fetchedUsers => {
      setUsers(fetchedUsers);
      if (fetchedUsers.length > 0) {
        setSelectedUserId(fetchedUsers[0].id);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userToLogin = users.find(u => u.id === selectedUserId);
    if (userToLogin) {
      login(userToLogin);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
            <BuildingLibraryIcon className="mx-auto h-16 w-16 text-brand-primary"/>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Data Governance Scorecard
            </h2>
            <p className="mt-2 text-sm text-gray-600">
                Sign in to continue to your dashboard
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="relative">
            <label htmlFor="user-select" className="sr-only">Select a user to sign in as</label>
            <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm appearance-none"
              disabled={loading}
            >
              {loading ? (
                <option>Loading users...</option>
              ) : (
                users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={!selectedUserId || loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors disabled:bg-slate-400"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;