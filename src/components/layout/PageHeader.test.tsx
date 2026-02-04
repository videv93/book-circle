import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title centered', () => {
    render(<PageHeader title="Home" />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Home');
  });

  it('has sticky positioning', () => {
    render(<PageHeader title="Test" />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
  });

  it('renders left slot when provided', () => {
    render(
      <PageHeader
        title="Test"
        leftSlot={<button aria-label="Go back">Back</button>}
      />
    );

    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('renders right slot when provided', () => {
    render(
      <PageHeader
        title="Test"
        rightSlot={<button aria-label="Settings">Settings</button>}
      />
    );

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders without slots when not provided', () => {
    render(<PageHeader title="Test" />);

    // Should not error and title should be visible
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('has proper structure with left, center, right sections', () => {
    render(
      <PageHeader
        title="Test"
        leftSlot={<span data-testid="left">Left</span>}
        rightSlot={<span data-testid="right">Right</span>}
      />
    );

    // Verify all sections are present
    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('applies backdrop blur styling', () => {
    render(<PageHeader title="Test" />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('backdrop-blur');
  });
});
