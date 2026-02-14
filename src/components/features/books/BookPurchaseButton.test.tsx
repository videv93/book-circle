import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookPurchaseButton } from './BookPurchaseButton';

describe('BookPurchaseButton', () => {
  it('renders OpenLibrary link with ISBN', () => {
    render(<BookPurchaseButton isbn="1234567890" />);

    const link = screen.getByRole('link', { name: /free on openlibrary/i });
    expect(link).toHaveAttribute(
      'href',
      'https://openlibrary.org/isbn/1234567890'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders Amazon affiliate link pointing to API route', () => {
    render(<BookPurchaseButton isbn="1234567890" bookId="book-1" />);

    const link = screen.getByRole('link', { name: /buy on amazon/i });
    const href = link.getAttribute('href')!;
    expect(href).toContain('/api/affiliate');
    expect(href).toContain('isbn=1234567890');
    expect(href).toContain('provider=amazon');
    expect(href).toContain('bookId=book-1');
  });

  it('renders Bookshop.org affiliate link pointing to API route', () => {
    render(<BookPurchaseButton isbn="1234567890" bookId="book-1" />);

    const link = screen.getByRole('link', { name: /buy on bookshop\.org/i });
    const href = link.getAttribute('href')!;
    expect(href).toContain('/api/affiliate');
    expect(href).toContain('isbn=1234567890');
    expect(href).toContain('provider=bookshop');
    expect(href).toContain('bookId=book-1');
  });

  it('shows affiliate disclosure text on both purchase buttons', () => {
    render(<BookPurchaseButton isbn="1234567890" />);
    const disclosures = screen.getAllByText('(supports app)');
    expect(disclosures).toHaveLength(2);
  });

  it('renders section heading', () => {
    render(<BookPurchaseButton isbn="1234567890" />);
    expect(screen.getByText('Get this book')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<BookPurchaseButton isbn="1234567890" />);

    expect(
      screen.getByRole('link', { name: /free on openlibrary/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /buy on amazon/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /buy on bookshop\.org/i })
    ).toBeInTheDocument();
  });

  it('has minimum 44px touch targets', () => {
    render(<BookPurchaseButton isbn="1234567890" />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.className).toContain('min-h-[44px]');
    });
  });

  it('works without bookId', () => {
    render(<BookPurchaseButton isbn="1234567890" />);
    const amazonLink = screen.getByRole('link', { name: /buy on amazon/i });
    expect(amazonLink.getAttribute('href')!).not.toContain('bookId');
    const bookshopLink = screen.getByRole('link', { name: /buy on bookshop\.org/i });
    expect(bookshopLink.getAttribute('href')!).not.toContain('bookId');
  });
});
