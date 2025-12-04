"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isPinned: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsPinned: (pinned: boolean) => void;
  togglePin: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Charger la préférence depuis localStorage au démarrage
  const [isPinned, setIsPinnedState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-pinned');
      return saved === 'true';
    }
    return false;
  });

  // Si la sidebar est épinglée, elle n'est pas réduite, sinon elle est réduite par défaut
  // En mobile, on ne réduit jamais la sidebar
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    if (typeof window !== 'undefined') {
      // En mobile, toujours false (pas de collapse)
      if (window.innerWidth < 1024) {
        return false;
      }
      const saved = localStorage.getItem('sidebar-pinned');
      return saved !== 'true';
    }
    return true;
  });

  // Sauvegarder la préférence dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-pinned', String(isPinned));
      // Ne réduire la sidebar qu'en desktop (>= 1024px)
      if (window.innerWidth >= 1024) {
        setIsCollapsedState(!isPinned);
      } else {
        // En mobile, toujours false (pas de collapse)
        setIsCollapsedState(false);
      }
    }
  }, [isPinned]);

  // Écouter les changements de taille d'écran
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // En mobile, toujours false (pas de collapse)
      if (window.innerWidth < 1024) {
        setIsCollapsedState(false);
      } else {
        // En desktop, utiliser la préférence isPinned
        setIsCollapsedState(!isPinned);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPinned]);

  const setIsPinned = (pinned: boolean) => {
    setIsPinnedState(pinned);
  };

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
  };

  const togglePin = () => {
    setIsPinnedState(!isPinned);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isPinned,
        setIsCollapsed,
        setIsPinned,
        togglePin,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

