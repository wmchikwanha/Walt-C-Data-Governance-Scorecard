import { createContext, useContext } from 'react';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUserContext: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
