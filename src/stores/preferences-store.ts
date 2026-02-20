"use client";

import { create } from "zustand";

// ============================================================================
// TYPES
// ============================================================================

export type ClockType = "analog" | "digital";
export type ClockFormat = "12h" | "24h";

interface PreferencesState {
  clockType: ClockType;
  clockFormat: ClockFormat;
  autoFollowNewSessions: boolean;
  isLoaded: boolean;

  loadPreferences: () => Promise<void>;
  setClockType: (type: ClockType) => Promise<void>;
  setClockFormat: (format: ClockFormat) => Promise<void>;
  setAutoFollowNewSessions: (enabled: boolean) => Promise<void>;
  cycleClockMode: () => Promise<void>;
}

const STORAGE_KEY = "joey-office-preferences";

function loadFromStorage(): Partial<PreferencesState> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // 忽略
  }
  return {};
}

function saveToStorage(prefs: {
  clockType: ClockType;
  clockFormat: ClockFormat;
  autoFollowNewSessions: boolean;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 忽略
  }
}

// ============================================================================
// STORE
// ============================================================================

export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  clockType: "analog",
  clockFormat: "12h",
  autoFollowNewSessions: true,
  isLoaded: false,

  loadPreferences: async () => {
    const prefs = loadFromStorage();
    set({
      clockType: (prefs.clockType as ClockType) || "analog",
      clockFormat: (prefs.clockFormat as ClockFormat) || "12h",
      autoFollowNewSessions: prefs.autoFollowNewSessions ?? true,
      isLoaded: true,
    });
  },

  setClockType: async (clockType) => {
    set({ clockType });
    const s = get();
    saveToStorage({
      clockType,
      clockFormat: s.clockFormat,
      autoFollowNewSessions: s.autoFollowNewSessions,
    });
  },

  setClockFormat: async (clockFormat) => {
    set({ clockFormat });
    const s = get();
    saveToStorage({
      clockType: s.clockType,
      clockFormat,
      autoFollowNewSessions: s.autoFollowNewSessions,
    });
  },

  setAutoFollowNewSessions: async (enabled) => {
    set({ autoFollowNewSessions: enabled });
    const s = get();
    saveToStorage({
      clockType: s.clockType,
      clockFormat: s.clockFormat,
      autoFollowNewSessions: enabled,
    });
  },

  cycleClockMode: async () => {
    const { clockType, clockFormat } = get();
    let newClockType: ClockType;
    let newClockFormat: ClockFormat;

    if (clockType === "analog") {
      newClockType = "digital";
      newClockFormat = "12h";
    } else if (clockType === "digital" && clockFormat === "12h") {
      newClockType = "digital";
      newClockFormat = "24h";
    } else {
      newClockType = "analog";
      newClockFormat = "12h";
    }

    set({ clockType: newClockType, clockFormat: newClockFormat });
    saveToStorage({
      clockType: newClockType,
      clockFormat: newClockFormat,
      autoFollowNewSessions: get().autoFollowNewSessions,
    });
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

export const selectClockType = (state: PreferencesState) => state.clockType;
export const selectClockFormat = (state: PreferencesState) => state.clockFormat;
export const selectAutoFollowNewSessions = (state: PreferencesState) =>
  state.autoFollowNewSessions;
export const selectIsLoaded = (state: PreferencesState) => state.isLoaded;
