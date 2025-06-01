import { render, screen } from '@testing-library/react';
import HtmlView from '../HtmlView';

describe('HtmlView Component', () => {
  it('renders HTML content correctly', () => {
    const html = '<p><strong>Bold HTML</strong></p>';
    render(<HtmlView id="html1" htmlContent={html} />);
    const strongElement = screen.getByText('Bold HTML');
    expect(strongElement).toBeInTheDocument();
    expect(strongElement.tagName).toBe('STRONG');
    expect(strongElement.closest('p')).toBeInTheDocument();
  });

  it('renders error message for non-string content', () => {
    // @ts-expect-error: Testing invalid prop type
    render(<HtmlView id="html2" htmlContent={123} />);
    expect(screen.getByText('Error: Invalid HTML content.')).toBeInTheDocument();
  });
});
