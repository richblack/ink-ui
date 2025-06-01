import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { server } from '../mocks/server'; // MSW server
import { http, HttpResponse } from 'msw'; // For overriding handlers
import { useLayoutStore } from '../store/layoutStore'; // To reset store state

// Reset Zustand store before each test to ensure isolation
beforeEach(() => {
  useLayoutStore.setState({
    layouts: {},
    activeLayoutId: null,
    isLoading: false,
    error: null,
    // Explicitly reset functions if they were mocked per test, though usually not needed for store itself
    // fetchAllLayoutsFromServer: jest.fn(), // or vi.fn() if using Vitest's jest extensions
    // saveLayoutToServer: jest.fn(),
  }, true); // 'true' replaces the entire state
});

describe('App Component - Integration with Backend (MSW)', () => {
  it('loads layouts from the server and displays them', async () => {
    render(<App />);
    expect(screen.getByText('Loading layouts...')).toBeInTheDocument();

    // Wait for the mocked "defaultServerLayout" to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('Mocked: Server Pane 1')).toBeInTheDocument();
    });
    expect(screen.getByText('Mocked: Server Pane 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Ink-UI/i })).toBeInTheDocument();
  });

  it('shows an error message if fetching layouts fails', async () => {
    server.use(
      http.get('/api/layouts', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    render(<App />);
    expect(screen.getByText('Loading layouts...')).toBeInTheDocument();

    await waitFor(() => {
      // The error message in layoutStore is err.message or String(err).
      // For HttpResponse(null, { status: 500 }), message might be empty.
      // Let's check for the generic part of the error.
      expect(screen.getByText(/Error loading layouts: Internal Server Error/i)).toBeInTheDocument();
    });
  });

  it('allows creating a new layout if no layouts are found', async () => {
    server.use(
      http.get('/api/layouts', () => {
        return HttpResponse.json([]); // Return empty array
      })
    );
    // Reset store state again for this specific scenario
    useLayoutStore.setState({ layouts: {}, activeLayoutId: null, isLoading: false, error: null }, true);


    render(<App />);
    // It first shows loading, then "No layouts found" screen
    await screen.findByText('No layouts found on the server.');

    const createButton = screen.getByRole('button', { name: /Create Default Layout/i });
    expect(createButton).toBeInTheDocument();

    // Mock the POST request for creating the layout
    server.use(
      http.post('/api/layout', async ({ request }) => {
        const newLayout = await request.json();
        // @ts-expect-error newLayout type
        mockLayouts[newLayout.id] = newLayout; // Add to a local mock db if needed for subsequent fetches in same test
        return HttpResponse.json(newLayout, { status: 201 });
      })
    );

    await userEvent.click(createButton);

    await waitFor(() => {
        expect(screen.getByText("Loaded from server or created by frontend (1)")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
