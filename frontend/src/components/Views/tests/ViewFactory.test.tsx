import { render, screen } from '@testing-library/react';
import ViewFactory from '../ViewFactory';
import { ViewConfig } from '../../../types'; // Using global type

describe('ViewFactory Component', () => {
  it('renders TextView for "text" type', () => {
    const viewConfig: ViewConfig = { id: 'v1', type: 'text', content: 'Test text' };
    render(<ViewFactory viewConfig={viewConfig} />);
    expect(screen.getByText('Test text')).toBeInTheDocument();
  });

  it('renders HtmlView for "html" type', () => {
    const viewConfig: ViewConfig = { id: 'v2', type: 'html', content: '<p>Test HTML</p>' };
    render(<ViewFactory viewConfig={viewConfig} />);
    expect(screen.getByText('Test HTML')).toBeInTheDocument();
    expect(screen.getByText('Test HTML').tagName).toBe('P');
  });

  it('renders WebhookTriggerView for "webhook_trigger" type', () => {
    const viewConfig: ViewConfig = {
      id: 'v_wh',
      type: 'webhook_trigger',
      content: { webhookUrl: 'http://example.com/hook', buttonText: 'Trigger Test' },
    };
    render(<ViewFactory viewConfig={viewConfig} />);
    expect(screen.getByRole('button', { name: 'Trigger Test' })).toBeInTheDocument();
    expect(screen.getByText('http://example.com/hook')).toBeInTheDocument();
  });

  it('renders unsupported message for unknown type', () => {
    const viewConfig: ViewConfig = { id: 'v3', type: 'unknown', content: 'N/A' };
    render(<ViewFactory viewConfig={viewConfig} />);
    expect(screen.getByText('Unsupported view type: unknown (ID: v3)')).toBeInTheDocument();
  });

  it('renders error message if viewConfig is missing', () => {
    // @ts-expect-error: Testing missing prop
    render(<ViewFactory viewConfig={undefined} />);
    expect(screen.getByText('Error: View configuration is missing.')).toBeInTheDocument();
  });
});
