import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Invite {
  token: string;
  vehicleId: string;
  ownerId: string;
  ownerName: string;
  vehicleName: string;
  createdAt: string;
  usedBy?: string;
}

interface InviteState {
  invites: Invite[];
  createInvite: (data: Omit<Invite, "token" | "createdAt">) => string;
  getInvite: (token: string) => Invite | null;
  markUsed: (token: string, driverId: string) => void;
}

export const useInviteStore = create<InviteState>()(
  persist(
    (set, get) => ({
      invites: [],

      createInvite: (data) => {
        const token =
          Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
        const invite: Invite = { ...data, token, createdAt: new Date().toISOString() };
        set((s) => ({ invites: [...s.invites, invite] }));
        return token;
      },

      getInvite: (token) => get().invites.find((i) => i.token === token) ?? null,

      markUsed: (token, driverId) =>
        set((s) => ({
          invites: s.invites.map((i) =>
            i.token === token ? { ...i, usedBy: driverId } : i
          ),
        })),
    }),
    { name: "sawari-invites" }
  )
);
