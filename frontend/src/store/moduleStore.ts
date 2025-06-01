import { create } from 'zustand';
import { ModuleConfig } from '../types';
import { fetchAllModules as apiFetchAllModules, createModule as apiCreateModule, fetchModule as apiFetchModule } from '../services/apiService';
import { useLayoutStore } from './layoutStore'; // To fetch and set active layout for a module

interface ModuleState {
  modules: Record<string, ModuleConfig>;
  activeModuleId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchAllModules: () => Promise<void>;
  createModule: (moduleData: ModuleConfig) => Promise<ModuleConfig | null>;
  setActiveModule: (moduleId: string | null) => Promise<void>; // Making it async to load layout
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  modules: {},
  activeModuleId: null,
  isLoading: false,
  error: null,

  fetchAllModules: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverModules = await apiFetchAllModules();
      const modulesMap: Record<string, ModuleConfig> = {};
      serverModules.forEach(mod => { modulesMap[mod.id] = mod; });
      set({ modules: modulesMap, isLoading: false });
      // Optionally set a default active module if none is active
      // if (serverModules.length > 0 && !get().activeModuleId) {
      //   get().setActiveModule(serverModules[0].id);
      // }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, isLoading: false });
      console.error("Failed to fetch modules:", errorMsg);
    }
  },

  createModule: async (moduleData) => {
    set({ isLoading: true, error: null });
    try {
      // Ensure referenced layout exists (frontend check or rely on backend)
      // For now, assume layout exists or backend handles it.
      const newModule = await apiCreateModule(moduleData);
      set(state => ({
        modules: { ...state.modules, [newModule.id]: newModule },
        isLoading: false
      }));
      return newModule;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, isLoading: false });
      console.error("Failed to create module:", errorMsg);
      return null;
    }
  },

  setActiveModule: async (moduleId: string | null) => {
    if (get().activeModuleId === moduleId && moduleId !== null) { // Ensure not to skip if moduleId is null (to clear active module)
        // Also check if layout for this module is already active
        const currentModule = get().modules[moduleId as string]; // moduleId is not null here
        const currentLayoutId = useLayoutStore.getState().activeLayoutId;
        if (currentModule && currentLayoutId === currentModule.layout_id) {
            // console.log(`Module ${moduleId} and its layout ${currentModule.layout_id} are already active.`);
            // set({ isLoading: false }); // Ensure loading is false if we skip
            return;
        }
    }


    set({ isLoading: true, error: null, activeModuleId: moduleId });
    if (moduleId) {
      try {
        const currentModule = get().modules[moduleId] ?? await apiFetchModule(moduleId);
        if (!currentModule) {
            throw new Error (\`Module with ID \${moduleId} not found.\`);
        }
        if (!get().modules[moduleId]) { // if it was fetched, add to store
            set(state => ({ modules: { ...state.modules, [moduleId]: currentModule }}));
        }

        const layoutStore = useLayoutStore.getState();
        await layoutStore.fetchLayoutAndSetActive(currentModule.layout_id);

        set({ isLoading: false });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        set({ error: \`Failed to set active module or load its layout: \${errorMsg}\`, isLoading: false, activeModuleId: null });
        console.error("Error setting active module:", errorMsg);
        useLayoutStore.getState().setActiveLayout(null);
      }
    } else {
      useLayoutStore.getState().setActiveLayout(null);
      set({ isLoading: false });
    }
  },
}));
