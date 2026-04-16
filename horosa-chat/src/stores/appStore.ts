/**
 * App store — hydrates from IndexedDB on mount.
 * Zustand manages ephemeral UI state (loading, error, wizard-open, etc).
 * Profiles + chart cache live in Dexie. The store exposes synchronous
 * getters and async mutators that write through to DB.
 */
import { create } from "zustand";
import type { BaziData } from "../types/horosa";
import {
  db,
  listProfiles,
  saveProfile,
  deleteProfile,
  getChart,
  saveChart,
  getSetting,
  setSetting,
  type Profile,
  type ChartKind,
} from "../lib/db";

export type { Profile } from "../lib/db";
export type TabKey = ChartKind;

type AnyChart = Record<string, unknown> | BaziData | null;

interface ChartCache {
  // keyed by `${profileId}:${kind}`
  [key: string]: unknown;
}

interface AppState {
  // Hydration
  hydrated: boolean;

  // Persisted (synced to DB)
  profiles: Profile[];
  activeProfileId: string | null;
  activeTab: TabKey;
  chartCache: ChartCache;

  // Ephemeral UI
  loading: boolean;
  error: string | null;
  profileDraft: Profile | null;      // non-null when editing/creating
  pendingDelete: Profile | null;      // confirmation modal target

  // Actions
  hydrate: () => Promise<void>;
  addOrUpdateProfile: (p: Profile) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string | null) => Promise<void>;
  setActiveTab: (t: TabKey) => Promise<void>;
  setChart: (profileId: string, kind: TabKey, payload: unknown) => Promise<void>;
  loadChartFromCache: (profileId: string, kind: TabKey) => Promise<unknown | null>;

  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  openNewProfile: () => void;
  openEditProfile: (p: Profile) => void;
  closeProfileDraft: () => void;
  askDelete: (p: Profile) => void;
  cancelDelete: () => void;
}

function ck(profileId: string, kind: TabKey) {
  return `${profileId}:${kind}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  profiles: [],
  activeProfileId: null,
  activeTab: "bazi",
  chartCache: {},
  loading: false,
  error: null,
  profileDraft: null,
  pendingDelete: null,

  async hydrate() {
    const profiles = await listProfiles();
    const activeProfileId = (await getSetting("activeProfileId")) ?? null;
    const activeTabRaw = (await getSetting("activeTab")) ?? "bazi";
    const validTabs: TabKey[] = ["bazi", "ziwei", "astro", "sixyao", "qimen", "predict"];
    const activeTab = (validTabs.includes(activeTabRaw as TabKey) ? activeTabRaw : "bazi") as TabKey;

    // Preload chart cache for active profile, all tabs
    const cache: ChartCache = {};
    if (activeProfileId) {
      for (const kind of validTabs) {
        const rec = await getChart(activeProfileId, kind);
        if (rec) cache[ck(activeProfileId, kind)] = rec.payload;
      }
    }

    set({
      profiles,
      activeProfileId: activeProfileId && profiles.some((p) => p.id === activeProfileId) ? activeProfileId : null,
      activeTab,
      chartCache: cache,
      hydrated: true,
    });
  },

  async addOrUpdateProfile(p) {
    await saveProfile(p);
    const profiles = await listProfiles();
    set({
      profiles,
      activeProfileId: p.id,
      profileDraft: null,
      error: null,
    });
    await setSetting("activeProfileId", p.id);

    // Preload cache for newly-active profile
    const validTabs: TabKey[] = ["bazi", "ziwei", "astro", "sixyao", "qimen", "predict"];
    const cache: ChartCache = { ...get().chartCache };
    for (const kind of validTabs) {
      const rec = await getChart(p.id, kind);
      if (rec) cache[ck(p.id, kind)] = rec.payload;
    }
    set({ chartCache: cache });
  },

  async removeProfile(id) {
    await deleteProfile(id);
    const profiles = await listProfiles();
    const cache = { ...get().chartCache };
    for (const key of Object.keys(cache)) {
      if (key.startsWith(`${id}:`)) delete cache[key];
    }
    const active = get().activeProfileId;
    const newActive = active === id ? null : active;
    set({
      profiles,
      chartCache: cache,
      activeProfileId: newActive,
      pendingDelete: null,
    });
    await setSetting("activeProfileId", newActive ?? "");
  },

  async setActiveProfile(id) {
    set({ activeProfileId: id, error: null });
    await setSetting("activeProfileId", id ?? "");

    if (id) {
      // Preload cache for this profile if not already loaded
      const cache: ChartCache = { ...get().chartCache };
      const validTabs: TabKey[] = ["bazi", "ziwei", "astro", "sixyao", "qimen", "predict"];
      for (const kind of validTabs) {
        const key = ck(id, kind);
        if (cache[key] === undefined) {
          const rec = await getChart(id, kind);
          if (rec) cache[key] = rec.payload;
        }
      }
      set({ chartCache: cache });
    }
  },

  async setActiveTab(t) {
    set({ activeTab: t });
    await setSetting("activeTab", t);
  },

  async setChart(profileId, kind, payload) {
    await saveChart(profileId, kind, payload);
    set((s) => ({ chartCache: { ...s.chartCache, [ck(profileId, kind)]: payload } }));
  },

  async loadChartFromCache(profileId, kind) {
    const key = ck(profileId, kind);
    const cached = get().chartCache[key];
    if (cached !== undefined) return cached;
    const rec = await getChart(profileId, kind);
    if (rec) {
      set((s) => ({ chartCache: { ...s.chartCache, [key]: rec.payload } }));
      return rec.payload;
    }
    return null;
  },

  setLoading(v) { set({ loading: v }); },
  setError(e) { set({ error: e }); },
  openNewProfile() { set({ profileDraft: {} as Profile }); },
  openEditProfile(p) { set({ profileDraft: p }); },
  closeProfileDraft() { set({ profileDraft: null }); },
  askDelete(p) { set({ pendingDelete: p }); },
  cancelDelete() { set({ pendingDelete: null }); },
}));

// ─── Synchronous selectors ───

export function useActiveProfile(): Profile | null {
  return useAppStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null);
}

export function useCachedChart(profileId: string | null, kind: TabKey): AnyChart {
  return useAppStore((s) => {
    if (!profileId) return null;
    return (s.chartCache[`${profileId}:${kind}`] as AnyChart) ?? null;
  });
}

// Export db ref for direct access if needed
export { db };
