import { create } from "zustand";
import type { BaziData } from "../types/horosa";

export interface Profile {
  id: string;
  name: string;
  gender: "M" | "F" | "X";
  birthDate: string;
  birthTime: string;
  zone: string;
  lat: string;
  lon: string;
  location: string;
}

interface AppState {
  profiles: Profile[];
  activeProfile: Profile | null;
  baziData: BaziData | null;
  loading: boolean;
  error: string | null;

  setActiveProfile: (p: Profile | null) => void;
  addProfile: (p: Profile) => void;
  setBaziData: (d: BaziData | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profiles: [],
  activeProfile: null,
  baziData: null,
  loading: false,
  error: null,

  setActiveProfile: (p) => set({ activeProfile: p, baziData: null, error: null }),
  addProfile: (p) =>
    set((s) => ({ profiles: [...s.profiles, p], activeProfile: p })),
  setBaziData: (d) => set({ baziData: d }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
}));
