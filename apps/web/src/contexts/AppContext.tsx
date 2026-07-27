import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStoredPatientId, getStoredToken, setStoredPatientId, setStoredToken } from "@/lib/auth-token";

type Language = "en" | "fil";

interface AppContextType {
  /** 0 means "no patient selected yet" — callers should treat this as not-ready and gate queries on `patientId > 0`. */
  patientId: number;
  setPatientId: (id: number) => void;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  largerTextEnabled: boolean;
  setLargerTextEnabled: (enabled: boolean) => void;
  highContrastEnabled: boolean;
  setHighContrastEnabled: (enabled: boolean) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  "Take": { en: "Take", fil: "Inumin" },
  "Snooze": { en: "Snooze", fil: "I-snooze" },
  "Dispense Now": { en: "Dispense Now", fil: "Ilabas Ngayon" },
  "Taken": { en: "Taken", fil: "Nainom na" },
  "Missed": { en: "Missed", fil: "Napalampas" },
  "Add Medication": { en: "Add Medication", fil: "Magdagdag ng Gamot" },
  "No medications yet. Add the first one to start the dispensing schedule.": {
    en: "No medications yet. Add the first one to start the dispensing schedule.",
    fil: "Wala pang gamot. Magdagdag ng una para simulan ang iskedyul."
  },
  "Dashboard": { en: "Dashboard", fil: "Dashboard" },
  "Medications": { en: "Medications", fil: "Mga Gamot" },
  "Dispenser": { en: "Dispenser", fil: "Dispenser" },
  "Adherence": { en: "Adherence", fil: "Pagsunod" },
  "Emergency QR": { en: "Emergency QR", fil: "Emergency QR" },
  "Settings": { en: "Settings", fil: "Mga Setting" },
  "Log Out": { en: "Log Out", fil: "Mag-log Out" },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patientId, setPatientIdState] = useState<number>(() => getStoredPatientId() ?? 0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getStoredToken()));
  const [language, setLanguage] = useState<Language>("en");
  const [largerTextEnabled, setLargerTextEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);

  const setPatientId = useCallback((id: number) => {
    setPatientIdState(id);
    setStoredPatientId(id || null);
  }, []);

  const login = useCallback((token: string) => {
    setStoredToken(token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredPatientId(null);
    setPatientIdState(0);
    setIsAuthenticated(false);
  }, []);

  // Keep auth state in sync across tabs (e.g. logging out in one tab logs out the others)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "meditrack_token") {
        setIsAuthenticated(Boolean(e.newValue));
        if (!e.newValue) {
          setPatientIdState(0);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (largerTextEnabled) {
      document.documentElement.classList.add("text-lg");
    } else {
      document.documentElement.classList.remove("text-lg");
    }
  }, [largerTextEnabled]);

  useEffect(() => {
    if (highContrastEnabled) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrastEnabled]);

  const t = (key: string) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <AppContext.Provider
      value={{
        patientId,
        setPatientId,
        isAuthenticated,
        login,
        logout,
        language,
        setLanguage,
        largerTextEnabled,
        setLargerTextEnabled,
        highContrastEnabled,
        setHighContrastEnabled,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
