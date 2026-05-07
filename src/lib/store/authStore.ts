import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole, Language } from "@/lib/types";
import { usePrefsStore } from "@/lib/store/prefsStore";

const MOCK_USERS: Record<string, User> = {
  "03001234567": {
    id: "1",
    name: "Muhammad Ilyas",
    phone: "03001234567",
    role: "owner",
    language: "en",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  "03011234567": {
    id: "2",
    name: "Ahmed Khan",
    phone: "03011234567",
    role: "driver",
    language: "en",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  language: Language;

  login: (phone: string, otp: string) => Promise<void>;
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      role: null,
      language: "en",

      login: async (phone: string, _otp: string) => {
        set({ isLoading: true });

        // Simulate network delay
        await new Promise((r) => setTimeout(r, 800));

        const mockUser = MOCK_USERS[phone];
        const user: User = mockUser ?? {
          id: Date.now().toString(),
          name: "Test User",
          phone,
          role: "owner", // placeholder — role-select will override
          language: get().language,
          createdAt: new Date().toISOString(),
        };

        set({
          user,
          token: "mock-jwt-token",
          isAuthenticated: true,
          role: null, // always force role-select after login
          isLoading: false,
        });
      },

      setRole: (role: UserRole) => {
        const user = get().user;
        set({
          role,
          user: user ? { ...user, role } : null,
        });
      },

      setLanguage: (lang: Language) => {
        set({ language: lang });
        // keep prefsStore (used by useTranslation) in sync
        usePrefsStore.getState().setLanguage(lang);
        const user = get().user;
        if (user) set({ user: { ...user, language: lang } });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: null,
        });
      },

      checkAuth: () => {
        const { token, user } = get();
        return !!(token && user);
      },
    }),
    {
      name: "sawari-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        language: state.language,
      }),
    }
  )
);
