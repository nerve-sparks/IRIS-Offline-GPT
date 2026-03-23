// src/services/tempChatStore.ts
// ────────────────────────────────────────────────────────────────────────────
// RAM-only store for Incognito / Temporary Chat sessions.
// NOTHING in this file ever calls AsyncStorage, writes to disk, or notifies
// the main conversationStore listeners.  When the session ends the JS GC
// reclaims all memory; the OS reclaims it on process kill.
// ────────────────────────────────────────────────────────────────────────────

export interface TempMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  isStarred: boolean;
  isPinned: boolean;
}

// ── Internal state ─────────────────────────────────────────────────────────
let _sessionId: string | null = null;
let _messages: TempMessage[] = [];

// ── Session lifecycle ───────────────────────────────────────────────────────

/** Start a fresh incognito session. Returns the new session id. */
export const startTempSession = (): string => {
  _messages = [];
  _sessionId = `temp_${Date.now()}`;
  return _sessionId;
};

/**
 * End the current session and wipe all in-memory messages.
 * After this call the array is eligible for garbage collection.
 */
export const endTempSession = (): void => {
  _messages = [];
  _sessionId = null;
};

/** True if a temp session is currently active. */
export const hasTempSession = (): boolean => _sessionId !== null;

// ── Message API ─────────────────────────────────────────────────────────────

/**
 * Append a message to the current temp session.
 * Returns the message object (same shape as ChatScreen's local Message).
 */
export const addTempMessage = (
  text: string,
  isUser: boolean,
): TempMessage => {
  const msg: TempMessage = {
    id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    text,
    isUser,
    timestamp: new Date().toISOString(),
    isStarred: false,
    isPinned: false,
  };
  _messages = [..._messages, msg];
  return msg;
};

/** Snapshot of all messages in the current temp session. */
export const getTempMessages = (): TempMessage[] => [..._messages];

/**
 * Update the last bot message in-place (for streaming tokens).
 * Returns the updated message, or null if not found.
 */
export const appendTokenToLastTempMessage = (token: string): TempMessage | null => {
  if (_messages.length === 0) return null;
  const last = _messages[_messages.length - 1];
  if (last.isUser) return null; // safety guard
  const updated = { ...last, text: last.text + token };
  _messages = [..._messages.slice(0, -1), updated];
  return updated;
};
