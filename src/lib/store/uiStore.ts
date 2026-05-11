import { create } from 'zustand';

interface UIState {
  previewImageUrl: string | null;
  setPreviewImage: (url: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  previewImageUrl: null,
  setPreviewImage: (url) => set({ previewImageUrl: url }),
}));
