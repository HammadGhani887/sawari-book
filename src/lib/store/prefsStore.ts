import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language } from "@/lib/types";

interface PrefsState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    { name: "sawari-prefs" }
  )
);
