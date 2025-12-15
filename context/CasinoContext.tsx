import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserState } from '../types';

interface CasinoContextType {
  user: UserState;
  updateBalance: (amount: number) => void;
  login: (username: string) => void;
  logout: () => void;
}

const CasinoContext = createContext<CasinoContextType | undefined>(undefined);

const STORAGE_KEY = 'ROYAL_MOCK_USER';

export const CasinoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [user, setUser] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load user from local storage", e);
    }
    return {
      balance: 1000, // Starting fake money
      username: '',
      isLoggedIn: false
    };
  });

  // Persist user state to localStorage whenever it changes (balance updates, etc.)
  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const updateBalance = (amount: number) => {
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  };

  const login = (username: string) => {
    setUser(prev => ({
      ...prev,
      username,
      isLoggedIn: true,
      balance: prev.balance > 0 ? prev.balance : 1000 // Keep balance if re-logging or default to 1000
    }));
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser({
      balance: 1000,
      username: '',
      isLoggedIn: false
    });
  };

  return (
    <CasinoContext.Provider value={{ user, updateBalance, login, logout }}>
      {children}
    </CasinoContext.Provider>
  );
};

export const useCasino = () => {
  const context = useContext(CasinoContext);
  if (!context) {
    throw new Error('useCasino must be used within a CasinoProvider');
  }
  return context;
};