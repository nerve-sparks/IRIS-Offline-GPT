import React, { createContext, useContext, useMemo, useState } from 'react';
import { endTempSession } from './tempChatStore';

type IncognitoContextValue = {
  isIncognito: boolean;
  toggleIncognito: () => void;
  disableIncognito: () => void;
};

const IncognitoContext = createContext<IncognitoContextValue | null>(null);

export function IncognitoProvider({ children }: { children: React.ReactNode }) {
  const [isIncognito, setIsIncognito] = useState(false);

  const toggleIncognito = () => {
    setIsIncognito(prev => {
      const next = !prev;
      if (!next) endTempSession();
      return next;
    });
  };

  const disableIncognito = () => {
    setIsIncognito(false);
    endTempSession();
  };

  const value = useMemo(
    () => ({ isIncognito, toggleIncognito, disableIncognito }),
    [isIncognito]
  );

  return <IncognitoContext.Provider value={value}>{children}</IncognitoContext.Provider>;
}

export function useIncognito() {
  const ctx = useContext(IncognitoContext);
  if (!ctx) {
    throw new Error('useIncognito must be used within IncognitoProvider');
  }
  return ctx;
}
