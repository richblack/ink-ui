import { render, screen } from '@testing-library/react';
import Layout from '../Layout';
import { useLayoutStore, LayoutConfig } from '../../../store/layoutStore';
import { vi } from 'vitest'; // For mocking

// Mock the store
vi.mock('../../../store/layoutStore', async () => {
  const actual = await vi.importActual('../../../store/layoutStore');
  return {
    ...actual,
    useLayoutStore: vi.fn(),
  };
});

const mockUseLayoutStore = useLayoutStore as jest.Mock;


describe('Layout Component', () => {
  it('renders panes based on layoutConfig', () => {
    const mockLayout: LayoutConfig = {
      id: 'testLayout',
      direction: 'horizontal',
      panes: [
        { id: 'p1', size: 50 },
        { id: 'p2', size: 50 },
      ],
    };
    mockUseLayoutStore.mockReturnValue({
        layouts: { testLayout: mockLayout },
        activeLayoutId: 'testLayout',
        updatePaneSize: vi.fn(),
        // Add other store properties/methods if needed by the component
        addLayout: vi.fn(),
        setActiveLayout: vi.fn(),
    });

    render(<Layout layoutConfig={mockLayout} />);
    expect(screen.getByText('Content for p1')).toBeInTheDocument();
    expect(screen.getByText('Content for p2')).toBeInTheDocument();
  });

  it('shows loading when layoutConfig is not provided', () => {
     mockUseLayoutStore.mockReturnValue({
        layouts: {},
        activeLayoutId: null,
        updatePaneSize: vi.fn(),
        addLayout: vi.fn(),
        setActiveLayout: vi.fn(),
    });
    // @ts-expect-error: Testing undefined prop
    render(<Layout layoutConfig={undefined} />);
    expect(screen.getByText('Loading layout...')).toBeInTheDocument();
  });
});
