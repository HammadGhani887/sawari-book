import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole, Language } from "@/lib/types";
import { usePrefsStore } from "@/lib/store/prefsStore";

interface StoredUser extends User {
  passwordHash: string;
}

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

const SEED_USERS: StoredUser[] = [];

interface AuthState {
  registeredUsers: StoredUser[];
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  role: UserRole | null;

  register: (data: RegisterData) => { ok: boolean; error?: string };
  login: (credential: string, password: string) => { ok: boolean; error?: string };
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
      registeredUsers: SEED_USERS,
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      language: "en",
      role: null,

      register: (data) => {
        const users = get().registeredUsers;
        const exists = users.find(
          (u) =>
            u.phone === data.phone.trim() ||
            (data.email && u.email === data.email.trim())
        );
        if (exists) return { ok: false, error: "Phone or email already registered" };

        const id = `u${Date.now()}`;
        const stored: StoredUser = {
          id,
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || undefined,
          role: data.role,
          language: get().language,
          cnic: data.cnic || undefined,
          photoUrl: data.photoUrl || undefined,
          licenseImageUrl: data.licenseImageUrl || undefined,
          passwordHash: data.password,
          createdAt: new Date().toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = stored;
        set({
          registeredUsers: [...users, stored],
          user,
          token: `tok-${id}`,
          isAuthenticated: true,
          role: data.role,
        });
        return { ok: true };
      },

      login: (credential, password) => {
        const users = get().registeredUsers;
        const found = users.find(
          (u) =>
            (u.phone === credential.trim() || u.email === credential.trim()) &&
            u.passwordHash === password
        );
        if (!found) return { ok: false, error: "Incorrect phone/email or password" };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = found;
        set({ user, token: `tok-${found.id}`, isAuthenticated: true, role: found.role });
        return { ok: true };
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false, role: null }),

      updateProfile: (data) => {
        const user = get().user;
        if (!user) return;
        const updated = { ...user, ...data };
        set({
          user: updated,
          registeredUsers: get().registeredUsers.map((u) =>
            u.id === user.id ? { ...u, ...data } : u
          ),
        });
        if (data.language) usePrefsStore.getState().setLanguage(data.language);
      },

      changePassword: (current, next) => {
        const user = get().user;
        if (!user) return { ok: false, error: "Not logged in" };
        const stored = get().registeredUsers.find((u) => u.id === user.id);
        if (!stored || stored.passwordHash !== current)
          return { ok: false, error: "Current password is incorrect" };
        set({
          registeredUsers: get().registeredUsers.map((u) =>
            u.id === user.id ? { ...u, passwordHash: next } : u
          ),
        });
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
        registeredUsers: state.registeredUsers,
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        language: state.language,
      }),
    }
  )
);
