import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import WebhookTriggerView from '../WebhookTriggerView';
import { vi } from 'vitest'; // Import vi

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookTriggerView Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders with initial props and triggers a GET webhook', async () => {
    const mockUrl = 'https://test.com/gethook';
    const mockResponseData = { message: 'GET success' };
    // Vitest's vi.mocked(axios) returns a JestMockExtended. For simple cases, can just cast.
    (mockedAxios as any).mockResolvedValueOnce({ data: mockResponseData, status: 200, statusText: 'OK', headers: {}, config: {} as any });

    render(<WebhookTriggerView id="wh1" webhookUrl={mockUrl} method="GET" buttonText="Test GET" />);

    expect(screen.getByText('URL:')).toBeInTheDocument();
    expect(screen.getByText(mockUrl)).toBeInTheDocument();
    expect(screen.getByText('Method:')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();

    const triggerButton = screen.getByRole('button', { name: 'Test GET' });
    expect(triggerButton).toBeInTheDocument();

    await userEvent.click(triggerButton);

    expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: mockUrl,
    }));

    await waitFor(() => {
      expect(screen.getByText('Response:')).toBeInTheDocument();
      expect(screen.getByText(JSON.stringify(mockResponseData, null, 2))).toBeInTheDocument();
    });
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('triggers a POST webhook with JSON body', async () => {
    const mockUrl = 'https://test.com/posthook';
    const requestBody = { key: 'value' };
    const mockResponseData = { message: 'POST success' };
    (mockedAxios as any).mockResolvedValueOnce({ data: mockResponseData, status: 201, statusText: 'Created', headers: {}, config: {} as any });

    render(
      <WebhookTriggerView
        id="wh2"
        webhookUrl={mockUrl}
        method="POST"
        requestBody={requestBody}
        buttonText="Test POST"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Test POST' }));

    expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: mockUrl,
      data: requestBody,
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify(mockResponseData, null, 2))).toBeInTheDocument();
    });
  });

  it('triggers a POST webhook with stringified JSON body', async () => {
    const mockUrl = 'https://test.com/posthook_string';
    const requestBodyString = '{ "key": "value_string" }';
    const parsedBody = { key: "value_string" };
    const mockResponseData = { message: 'POST success string body' };
    (mockedAxios as any).mockResolvedValueOnce({ data: mockResponseData, status: 201, headers: {}, config: {} as any, statusText: "Created" });

    render(
      <WebhookTriggerView
        id="wh_str"
        webhookUrl={mockUrl}
        method="POST"
        requestBody={requestBodyString}
        buttonText="Test POST String"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Test POST String' }));
    expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: mockUrl,
      data: parsedBody, // Should be parsed
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify(mockResponseData, null, 2))).toBeInTheDocument();
    });
  });

  it('triggers a POST webhook with plain text string body if not JSON parsable', async () => {
    const mockUrl = 'https://test.com/posthook_text';
    const requestBodyString = 'This is plain text';
    const mockResponseData = { message: 'POST success text body' };
    (mockedAxios as any).mockResolvedValueOnce({ data: mockResponseData, status: 200, headers: {}, config: {} as any, statusText: "OK" });

    render(
      <WebhookTriggerView
        id="wh_text"
        webhookUrl={mockUrl}
        method="POST"
        requestBody={requestBodyString}
        buttonText="Test POST Plain Text"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Test POST Plain Text' }));
    expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: mockUrl,
      data: requestBodyString, // Should be sent as is
      headers: expect.objectContaining({ 'Content-Type': 'text/plain' }),
    }));
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify(mockResponseData, null, 2))).toBeInTheDocument();
    });
  });


  it('displays an error message if webhook URL is not configured', async () => {
    render(<WebhookTriggerView id="wh3" webhookUrl="" />);
    await userEvent.click(screen.getByRole('button', { name: 'Trigger Webhook' }));
    expect(screen.getByText('Webhook URL is not configured.')).toBeInTheDocument();
    expect(mockedAxios).not.toHaveBeenCalled();
  });

  it('displays an error message if the webhook call fails', async () => {
    const mockUrl = 'https://test.com/failhook';
    (mockedAxios as any).mockRejectedValueOnce({ message: 'Network Error' }); // Simulate network error

    render(<WebhookTriggerView id="wh4" webhookUrl={mockUrl} />);
    await userEvent.click(screen.getByRole('button', { name: 'Trigger Webhook' }));

    await waitFor(() => {
      // Error message might include "Error: " prefix from the component
      expect(screen.getByText((content, element) => content.startsWith('Error:') && content.includes('Network Error'))).toBeInTheDocument();
    });
  });

  it('displays Axios error response details', async () => {
    const mockUrl = 'https://test.com/axiosfail';
    const errorResponse = { status: 500, data: { detail: "Server exploded" } };
    const axiosError = { isAxiosError: true, response: errorResponse, request: {}, message: "Request failed with status code 500", config: {} as any, toJSON: () => ({}) };
    (mockedAxios as any).mockRejectedValueOnce(axiosError);

    render(<WebhookTriggerView id="wh5" webhookUrl={mockUrl} />);
    await userEvent.click(screen.getByRole('button', { name: 'Trigger Webhook' }));

    await waitFor(() => {
      expect(screen.getByText(\`Error: \${errorResponse.status} - \${JSON.stringify(errorResponse.data)}\`)).toBeInTheDocument();
    });
  });
});
