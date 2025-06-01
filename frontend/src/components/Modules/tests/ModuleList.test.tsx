import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModuleList from '../ModuleList';
import { useModuleStore } from '../../../store/moduleStore';
import { useLayoutStore } from '../../../store/layoutStore';
import { vi } from 'vitest'; // Import vi

// Mock stores
const mockFetchAllModules = vi.fn();
const mockSetActiveModule = vi.fn();
const mockFetchLayoutAndSetActive = vi.fn();
const mockSetActiveLayout = vi.fn();

// Default state for moduleStore
const defaultModuleStoreState = {
  modules: {},
  activeModuleId: null,
  isLoading: false,
  error: null,
  fetchAllModules: mockFetchAllModules,
  setActiveModule: mockSetActiveModule,
};

// Default state for layoutStore
const defaultLayoutStoreState = {
  layouts: {},
  activeLayoutId: null,
  isLoading: false,
  error: null,
  fetchLayoutAndSetActive: mockFetchLayoutAndSetActive,
  setActiveLayout: mockSetActiveLayout,
  // Add other layoutStore methods if they are called or needed by ModuleList/setActiveModule chain
  addLayout: vi.fn(),
  updatePaneSize: vi.fn(),
  fetchAllLayoutsFromServer: vi.fn(),
  saveLayoutToServer: vi.fn(),
};

vi.mock('../../../store/moduleStore', () => ({
  useModuleStore: vi.fn(() => defaultModuleStoreState),
}));
vi.mock('../../../store/layoutStore', () => ({
  useLayoutStore: vi.fn(() => defaultLayoutStoreState),
}));


describe('ModuleList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores to default states before each test
    (useModuleStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        ...defaultModuleStoreState,
        modules: {}, // Ensure modules are reset if modified by a test directly
        activeModuleId: null,
        isLoading: false,
        error: null,
    }));
    (useLayoutStore as ReturnType<typeof vi.fn>).mockImplementation(() => defaultLayoutStoreState);
  });

  it('renders loading state initially', () => {
    (useModuleStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      ...defaultModuleStoreState,
      isLoading: true,
    }));
    render(<ModuleList />);
    expect(screen.getByText('Loading modules...')).toBeInTheDocument();
    expect(mockFetchAllModules).toHaveBeenCalledTimes(1);
  });

  it('renders error state', () => {
    (useModuleStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      ...defaultModuleStoreState,
      error: 'Failed to load',
    }));
    render(<ModuleList />);
    expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
  });

  it('renders "No modules available" message', () => {
    render(<ModuleList />); // Uses default empty modules from beforeEach
    expect(screen.getByText('No modules available.')).toBeInTheDocument();
  });

  it('renders a list of modules and allows selecting one', async () => {
    const modulesData = {
      mod1: { id: 'mod1', name: 'Module One', layout_id: 'layout1' },
      mod2: { id: 'mod2', name: 'Module Two', layout_id: 'layout2' },
    };
    (useModuleStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      ...defaultModuleStoreState,
      modules: modulesData,
    }));

    render(<ModuleList />);
    expect(screen.getByText('Module One')).toBeInTheDocument();
    expect(screen.getByText('Module Two')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Module One'));
    expect(mockSetActiveModule).toHaveBeenCalledWith('mod1');
  });

  it('highlights the active module', () => {
    const modulesData = {
      mod1: { id: 'mod1', name: 'Module One', layout_id: 'layout1' },
    };
    (useModuleStore as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      ...defaultModuleStoreState,
      modules: modulesData,
      activeModuleId: 'mod1', // mod1 is active
    }));
    render(<ModuleList />);
    const moduleButton = screen.getByText('Module One');
    expect(moduleButton).toHaveClass('bg-blue-600'); // Active class
  });
});
