// src/services/incognitoContext.tsx
// ────────────────────────────────────────────────────────────────────────────
// Global React Context for Incognito / Temporary Chat mode.
// Wrap the app root with <IncognitoProvider> then use the useIncognito() hook
// anywhere in the tree — no prop-drilling needed.
// ────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback } from 'react';
import { startTempSession, endTempSession } from './tempChatStore';

interface IncognitoContextType {
  isIncognito: boolean;
  /** Enable incognito mode — starts a fresh RAM-only session. */
  enableIncognito: () => void;
  /** Disable incognito mode — wipes the RAM session, triggers onExit callback. */
  disableIncognito: () => void;
  /** Convenience toggle. */
  toggleIncognito: () => void;
}

const IncognitoContext = createContext<IncognitoContextType>({
  isIncognito: false,
  enableIncognito: () => {},
  disableIncognito: () => {},
  toggleIncognito: () => {},
});

interface ProviderProps {
  children: React.ReactNode;
  /** Optional callback fired when incognito mode is turned OFF (e.g. to clear the chat). */
  onDisable?: () => void;
}

export function IncognitoProvider({ children, onDisable }: ProviderProps) {
  const [isIncognito, setIsIncognito] = useState(false);

  const enableIncognito = useCallback(() => {
    startTempSession();
    setIsIncognito(true);
  }, []);

  const disableIncognito = useCallback(() => {
    endTempSession();
    setIsIncognito(false);
    onDisable?.();
  }, [onDisable]);

  const toggleIncognito = useCallback(() => {
    if (isIncognito) {
      disableIncognito();
    } else {
      enableIncognito();
    }
  }, [isIncognito, enableIncognito, disableIncognito]);

  return (
    <IncognitoContext.Provider value={{ isIncognito, enableIncognito, disableIncognito, toggleIncognito }}>
      {children}
    </IncognitoContext.Provider>
  );
}

/** Access incognito state + controls from any component. */
export const useIncognito = () => useContext(IncognitoContext);
