import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole, Language } from "@/lib/types";
import { usePrefsStore } from "@/lib/store/prefsStore";

export type RegisterData = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
  cnic?: string;
  photoUrl?: string;
  licenseImageUrl?: string;
};

export type ProfileUpdate = Partial<
  Pick<User, "name" | "phone" | "email" | "cnic" | "licenseImageUrl" | "language" | "photoUrl">
>;

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  role: UserRole | null;

  // Async API-backed actions
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
  login: (credential: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: ProfileUpdate) => void;
  changePassword: (current: string, next: string) => { ok: boolean; error?: string };
  setLanguage: (lang: Language) => void;
  setRole: (role: UserRole) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      language: "en",
      role: null,

      register: async (data) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (!res.ok) return { ok: false, error: json.error ?? "Registration failed" };
          set({
            user:            json.user,
            token:           json.token,
            isAuthenticated: true,
            role:            json.user.role as UserRole,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Network error. Check your connection." };
        }
      },

      login: async (credential, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential, password }),
          });
          const json = await res.json();
          if (!res.ok) return { ok: false, error: json.error ?? "Login failed" };
          set({
            user:            json.user,
            token:           json.token,
            isAuthenticated: true,
            role:            json.user.role as UserRole,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Network error. Check your connection." };
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false, role: null }),

      updateProfile: (data) => {
        const user = get().user;
        if (!user) return;
        const updated = { ...user, ...data };
        set({ user: updated });
        if (data.language) usePrefsStore.getState().setLanguage(data.language);
      },

      changePassword: () => {
        // TODO: implement via API when backend is ready
        return { ok: true };
      },

      setLanguage: (lang) => {
        set({ language: lang });
        usePrefsStore.getState().setLanguage(lang);
        const user = get().user;
        if (user) set({ user: { ...user, language: lang } });
      },

      setRole: (role) => {
        const user = get().user;
        set({ role, user: user ? { ...user, role } : null });
      },

      checkAuth: () => {
        const { token, user } = get();
        return !!(token && user);
      },
    }),
    {
      name: "sawari-auth",
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
        role:            state.role,
        language:        state.language,
      }),
    }
  )
);
