// Re-export existing types if they were here, or define new ones.
// For now, let's focus on ModuleConfig and assume Layout/View types are in layoutStore.ts or apiService.ts

export interface ViewConfig {
  id: string;
  type: string;
  content?: any;
}

export interface PaneConfig {
  id: string;
  size: number;
  view?: ViewConfig;
}

export interface LayoutConfig {
  id: string;
  direction: 'horizontal' | 'vertical';
  panes: PaneConfig[];
}

export interface ModuleConfig {
  id: string;
  name: string;
  layout_id: string;
  icon?: string;
  description?: string;
}
