import axios from 'axios';
// Use central types
import { LayoutConfig as LayoutDTO, ViewConfig as ViewDTO, PaneConfig as PaneDTO, ModuleConfig as ModuleDTO } from '../types';

const API_BASE_URL = '/api'; // Using relative path for proxying through Vite dev server or reverse proxy in production

export const fetchLayout = async (layoutId: string): Promise<LayoutDTO> => {
  const response = await axios.get<LayoutDTO>(`${API_BASE_URL}/layout/${layoutId}`);
  return response.data;
};

export const fetchAllLayouts = async (): Promise<LayoutDTO[]> => {
  const response = await axios.get<LayoutDTO[]>(`${API_BASE_URL}/layouts`);
  return response.data;
};

export const createLayout = async (layoutData: LayoutDTO): Promise<LayoutDTO> => {
  const response = await axios.post<LayoutDTO>(`${API_BASE_URL}/layout`, layoutData);
  return response.data;
};

// --- Module API Functions ---
export const fetchAllModules = async (): Promise<ModuleDTO[]> => {
  const response = await axios.get<ModuleDTO[]>(`${API_BASE_URL}/modules`);
  return response.data;
};

export const fetchModule = async (moduleId: string): Promise<ModuleDTO> => {
  const response = await axios.get<ModuleDTO>(`${API_BASE_URL}/module/${moduleId}`);
  return response.data;
};

export const createModule = async (moduleData: ModuleDTO): Promise<ModuleDTO> => {
  const response = await axios.post<ModuleDTO>(`${API_BASE_URL}/module`, moduleData);
  return response.data;
};
