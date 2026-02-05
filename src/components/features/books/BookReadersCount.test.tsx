import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookReadersCount } from './BookReadersCount';

describe('BookReadersCount', () => {
  it('displays empty state when no readers', () => {
    render(<BookReadersCount totalReaders={0} currentlyReading={0} />);

    expect(screen.getByTestId('readers-empty')).toBeInTheDocument();
    expect(
      screen.getByText('Be the first to add this book to your library!')
    ).toBeInTheDocument();
  });

  it('displays total readers count', () => {
    render(<BookReadersCount totalReaders={45} currentlyReading={0} />);

    expect(screen.getByTestId('readers-count')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('readers')).toBeInTheDocument();
  });

  it('uses singular "reader" for one reader', () => {
    render(<BookReadersCount totalReaders={1} currentlyReading={0} />);

    expect(screen.getByText('reader')).toBeInTheDocument();
  });

  it('displays currently reading count when greater than zero', () => {
    render(<BookReadersCount totalReaders={45} currentlyReading={12} />);

    expect(screen.getByTestId('currently-reading')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('currently reading')).toBeInTheDocument();
  });

  it('does not display currently reading when zero', () => {
    render(<BookReadersCount totalReaders={45} currentlyReading={0} />);

    expect(screen.queryByTestId('currently-reading')).not.toBeInTheDocument();
  });

  it('accepts additional className', () => {
    render(
      <BookReadersCount
        totalReaders={10}
        currentlyReading={5}
        className="custom-class"
      />
    );

    const container = screen.getByTestId('readers-count');
    expect(container.className).toContain('custom-class');
  });
});
