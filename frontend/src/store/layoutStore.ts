import { create } from 'zustand';
// Assuming ViewConfig, PaneConfig, LayoutConfig will now primarily come from ../types
// If they are used for store's internal representation and are compatible, this is fine.
// The types file was created in this subtask.
import { ViewConfig as GlobalViewConfig, PaneConfig as GlobalPaneConfig, LayoutConfig as GlobalLayoutConfig } from '../types';
import { fetchAllLayouts, createLayout as apiCreateLayout, fetchLayout, LayoutDTO } from '../services/apiService';

// Store-specific types can extend or use global types
export interface PaneConfig extends GlobalPaneConfig {}
export interface LayoutConfig extends GlobalLayoutConfig {}
export interface ViewConfig extends GlobalViewConfig {}


interface LayoutState {
  layouts: Record<string, LayoutConfig>;
  activeLayoutId: string | null;
  isLoading: boolean;
  error: string | null;
  addLayout: (layout: LayoutConfig) => void;
  setActiveLayout: (layoutId: string | null) => void;
  updatePaneSize: (layoutId: string, paneId: string, newSize: number) => void;
  fetchAllLayoutsFromServer: () => Promise<void>;
  saveLayoutToServer: (layout: LayoutConfig) => Promise<void>;
  fetchLayoutAndSetActive: (layoutId: string) => Promise<void>;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  layouts: {},
  activeLayoutId: null,
  isLoading: false,
  error: null,
  addLayout: (layout) =>
    set((state) => ({
      layouts: { ...state.layouts, [layout.id]: layout },
    })),
  setActiveLayout: (layoutId) => set({ activeLayoutId: layoutId, isLoading: false, error: null }),
  updatePaneSize: (layoutId, paneId, newSize) =>
    set((state) => {
      const layout = state.layouts[layoutId];
      if (!layout) return state;
      const updatedPanes = layout.panes.map((pane) =>
        pane.id === paneId ? { ...pane, size: newSize } : pane
      );
      return {
        layouts: {
          ...state.layouts,
          [layoutId]: { ...layout, panes: updatedPanes },
        },
      };
    }),
  fetchAllLayoutsFromServer: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverLayouts = await fetchAllLayouts();
      const layoutsMap: Record<string, LayoutConfig> = {};
      serverLayouts.forEach(layout => { layoutsMap[layout.id] = layout as LayoutConfig; });
      set({ layouts: layoutsMap, isLoading: false });
      if (serverLayouts.length > 0 && !get().activeLayoutId) {
        set({ activeLayoutId: serverLayouts[0].id });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },
  saveLayoutToServer: async (layout) => {
    set({ isLoading: true, error: null });
    try {
      const layoutDTO: LayoutDTO = { ...layout, panes: layout.panes.map(p => ({ ...p, view: p.view ? { ...p.view } : undefined })) };
      const savedLayout = await apiCreateLayout(layoutDTO);
      set((state) => ({
        layouts: { ...state.layouts, [savedLayout.id]: savedLayout as LayoutConfig },
        isLoading: false,
      }));
      if (!get().activeLayoutId) {
        set({ activeLayoutId: savedLayout.id });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      throw err;
    }
  },
  fetchLayoutAndSetActive: async (layoutId) => {
    set({ isLoading: true, error: null });
    try {
      const layout = await fetchLayout(layoutId);
      set(state => ({
        layouts: { ...state.layouts, [layout.id]: layout as LayoutConfig },
        activeLayoutId: layout.id,
        isLoading: false,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: `Failed to fetch or set layout ${layoutId}: ${errorMsg}`, isLoading: false, activeLayoutId: null });
      console.error(`Error fetching layout ${layoutId}:`, errorMsg);
    }
  },
}));
