// FIX: Replaced placeholder content with the main App component implementation.
import React, { useState, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthContextType } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { User, UserRole } from './types';
import LoginPage from './components/LoginPage';
import DepartmentHeadView from './components/DepartmentHeadView';
import SeniorManagementView from './components/SeniorManagementView';
import AdminView from './components/AdminView';
import UserProfile from './components/UserProfile';
import Header from './components/shared/Header';
import NotificationContainer from './components/shared/NotificationContainer';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
        const storedUser = localStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('currentUser');
        return null;
    }
  });

  const login = useCallback((userToLogin: User) => {
    localStorage.setItem('currentUser', JSON.stringify(userToLogin));
    setUser(userToLogin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
  }, []);
  
  const updateUserContext = useCallback((updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }, []);

  const authContextValue: AuthContextType = useMemo(() => ({
    user,
    login,
    logout,
    updateUserContext
  }), [user, login, logout, updateUserContext]);

  const Dashboard = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    switch (user.role) {
      case UserRole.DEPARTMENT_HEAD:
        return <DepartmentHeadView />;
      case UserRole.SENIOR_MANAGEMENT:
        return <SeniorManagementView />;
      case UserRole.ADMINISTRATOR:
        return <AdminView />;
      default:
        logout();
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-slate-100 font-sans">
              {user && <Header />}
              <main>
                <NotificationContainer />
                <Routes>
                  {user ? (
                    <>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                  )}
                </Routes>
              </main>
            </div>
          </Router>
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

export default App;