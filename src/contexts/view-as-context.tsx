'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  customRole: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  permissions?: string[]; // Alias pour faciliter l'accès
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
    // Si l'utilisateur a un customRole, copier les permissions dans un champ direct pour faciliter l'accès
    const userWithPermissions = user
      ? {
          ...user,
          permissions: user.customRole?.permissions || [],
        }
      : null;

    setViewAsUserState(userWithPermissions);
    if (userWithPermissions) {
      localStorage.setItem('viewAsUser', JSON.stringify(userWithPermissions));
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
