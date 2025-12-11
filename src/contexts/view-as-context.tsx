'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ViewAsContextType {
  viewAsUser: User | null;
  setViewAsUser: (user: User | null) => void;
  isViewingAsOther: boolean;
  clearViewAsUser: () => void;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAsUser, setViewAsUserState] = useState<User | null>(null);

  // Charger depuis le localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem('viewAsUser');
    if (stored) {
      try {
        setViewAsUserState(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('viewAsUser');
      }
    }
  }, []);

  const setViewAsUser = (user: User | null) => {
    setViewAsUserState(user);
    if (user) {
      localStorage.setItem('viewAsUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('viewAsUser');
    }
  };

  const clearViewAsUser = () => {
    setViewAsUser(null);
  };

  const isViewingAsOther = viewAsUser !== null;

  return (
    <ViewAsContext.Provider
      value={{
        viewAsUser,
        setViewAsUser,
        isViewingAsOther,
        clearViewAsUser,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (context === undefined) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}

