import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@infinity_heroes_app_settings";
const LEGACY_PREFERENCES_KEY = "@infinity_heroes_preferences";
const MIGRATION_DONE_KEY = "@infinity_heroes_settings_migrated";

export interface AppSettings {
  audioVolume: number;
  audioSpeed: number;
  narratorVoice: string;
  autoPlay: boolean;
  storyLength: "short" | "medium-short" | "medium" | "long" | "epic";
  ageRange: "2-4" | "4-6" | "6-8" | "8-10";
  defaultTheme: string;
  autoGenerateImages: boolean;
  extendMode: boolean;
  autoPlayNext: boolean;
  textSize: "small" | "medium" | "large";
  librarySortOrder: "recent" | "alphabetical" | "theme";
  showFavoritesOnly: boolean;
  autoSave: boolean;
  sleepTheme: string;
  isMuted: boolean;
  reducedMotion: boolean;
  fontSize: "normal" | "large";
}

export const DEFAULT_SETTINGS: AppSettings = {
  audioVolume: 80,
  audioSpeed: 1.0,
  narratorVoice: "moonbeam",
  autoPlay: false,
  storyLength: "medium",
  ageRange: "4-6",
  defaultTheme: "fantasy",
  autoGenerateImages: false,
  extendMode: false,
  autoPlayNext: false,
  textSize: "medium",
  librarySortOrder: "recent",
  showFavoritesOnly: false,
  autoSave: true,
  sleepTheme: "Cloud Kingdom",
  isMuted: false,
  reducedMotion: false,
  fontSize: "normal",
};

type SettingsAction =
  | { type: "UPDATE"; payload: Partial<AppSettings> }
  | { type: "RESET" }
  | { type: "LOAD"; payload: AppSettings };

function settingsReducer(state: AppSettings, action: SettingsAction): AppSettings {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.payload };
    case "RESET":
      return { ...DEFAULT_SETTINGS };
    case "LOAD":
      return { ...DEFAULT_SETTINGS, ...action.payload };
    default:
      return state;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    (async () => {
      try {
        let merged: Partial<AppSettings> = {};

        const data = await AsyncStorage.getItem(SETTINGS_KEY);
        if (data) {
          try { merged = JSON.parse(data); } catch {}
        }

        const migrated = await AsyncStorage.getItem(MIGRATION_DONE_KEY);
        if (!migrated) {
          const legacyData = await AsyncStorage.getItem(LEGACY_PREFERENCES_KEY);
          if (legacyData) {
            try {
              const legacy = JSON.parse(legacyData);
              if (legacy.sleepTheme && !merged.sleepTheme) merged.sleepTheme = legacy.sleepTheme;
              if (legacy.isMuted !== undefined && merged.isMuted === undefined) merged.isMuted = legacy.isMuted;
              if (legacy.reducedMotion !== undefined && merged.reducedMotion === undefined) merged.reducedMotion = legacy.reducedMotion;
              if (legacy.fontSize && !merged.fontSize) merged.fontSize = legacy.fontSize;
              if (legacy.narratorVoice && !merged.narratorVoice) merged.narratorVoice = legacy.narratorVoice;
              if (legacy.storyLength && !merged.storyLength) merged.storyLength = legacy.storyLength;
            } catch {}
          }
          await AsyncStorage.setItem(MIGRATION_DONE_KEY, "1");
        }

        dispatch({ type: "LOAD", payload: { ...DEFAULT_SETTINGS, ...merged } });
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    dispatch({ type: "UPDATE", payload: { [key]: value } as Partial<AppSettings> });
  };

  const resetSettings = () => {
    dispatch({ type: "RESET" });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
