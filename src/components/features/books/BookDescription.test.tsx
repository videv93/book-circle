import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookDescription } from './BookDescription';

describe('BookDescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays description text', () => {
    render(<BookDescription description="A great book about testing." />);

    expect(screen.getByTestId('description-text')).toHaveTextContent(
      'A great book about testing.'
    );
  });

  it('shows "No description available" when description is null', () => {
    render(<BookDescription description={null} />);

    expect(screen.getByTestId('no-description')).toBeInTheDocument();
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('shows "No description available" when description is undefined', () => {
    render(<BookDescription />);

    expect(screen.getByTestId('no-description')).toBeInTheDocument();
  });

  it('truncates long descriptions to 3 lines by default', () => {
    const longDescription =
      'This is a very long description that should be truncated when it exceeds 200 characters. ' +
      'It needs to be quite long to trigger the truncation behavior. ' +
      'Adding more text here to ensure we exceed the threshold.';

    render(<BookDescription description={longDescription} />);

    const text = screen.getByTestId('description-text');
    expect(text.className).toContain('line-clamp-3');
    expect(screen.getByTestId('expand-toggle')).toBeInTheDocument();
  });

  it('expands description when "Show more" is clicked', () => {
    const longDescription =
      'This is a very long description that should be truncated when it exceeds 200 characters. ' +
      'It needs to be quite long to trigger the truncation behavior. ' +
      'Adding more text here to ensure we exceed the threshold.';

    render(<BookDescription description={longDescription} />);

    const expandButton = screen.getByTestId('expand-toggle');
    expect(expandButton).toHaveTextContent('Show more');

    fireEvent.click(expandButton);

    expect(expandButton).toHaveTextContent('Show less');
    const text = screen.getByTestId('description-text');
    expect(text.className).not.toContain('line-clamp-3');
  });

  it('collapses description when "Show less" is clicked', () => {
    const longDescription =
      'This is a very long description that should be truncated when it exceeds 200 characters. ' +
      'It needs to be quite long to trigger the truncation behavior. ' +
      'Adding more text here to ensure we exceed the threshold.';

    render(<BookDescription description={longDescription} />);

    const expandButton = screen.getByTestId('expand-toggle');
    fireEvent.click(expandButton); // Expand
    fireEvent.click(expandButton); // Collapse

    expect(expandButton).toHaveTextContent('Show more');
    const text = screen.getByTestId('description-text');
    expect(text.className).toContain('line-clamp-3');
  });

  it('does not show expand toggle for short descriptions', () => {
    render(<BookDescription description="A short description." />);

    expect(screen.queryByTestId('expand-toggle')).not.toBeInTheDocument();
  });

  it('displays ISBN when provided', () => {
    render(<BookDescription isbn="978-0-123456-78-9" />);

    expect(screen.getByTestId('isbn-display')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 978-0-123456-78-9')).toBeInTheDocument();
  });

  it('copies ISBN to clipboard when copy button is clicked', async () => {
    // Mock clipboard API using vi.stubGlobal
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<BookDescription isbn="978-0-123456-78-9" />);

    const copyButton = screen.getByTestId('copy-isbn-button');
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('978-0-123456-78-9');

    vi.unstubAllGlobals();
  });

  it('shows check icon after copying', async () => {
    // Mock clipboard API using vi.stubGlobal
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<BookDescription isbn="978-0-123456-78-9" />);

    const copyButton = screen.getByTestId('copy-isbn-button');
    fireEvent.click(copyButton);

    // Wait for async clipboard operation and state update
    await waitFor(() => {
      const checkIcon = copyButton.querySelector('.text-green-600');
      expect(checkIcon).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it('does not display ISBN section when isbn is null', () => {
    render(<BookDescription description="Test" isbn={null} />);

    expect(screen.queryByTestId('isbn-display')).not.toBeInTheDocument();
  });

  it('accepts additional className', () => {
    render(<BookDescription description="Test" className="custom-class" />);

    const container = screen.getByTestId('book-description');
    expect(container.className).toContain('custom-class');
  });
});
