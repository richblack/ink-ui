import { render, screen } from '@testing-library/react';
import TextView from '../TextView';

describe('TextView Component', () => {
  it('renders content correctly', () => {
    render(<TextView id="text1" content="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Hello World').tagName).toBe('PRE');
  });

  it('renders multiline content correctly', () => {
    const multiline = "Line 1\nLine 2";
    render(<TextView id="text2" content={multiline} />);
    expect(screen.getByText(multiline)).toBeInTheDocument();
  });
});
