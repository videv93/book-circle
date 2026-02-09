import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookCheck } from 'lucide-react';
import { DashboardStatCard } from './DashboardStatCard';

describe('DashboardStatCard', () => {
  it('renders label and count', () => {
    render(
      <DashboardStatCard label="Pending Claims" count={5} icon={BookCheck} />
    );

    expect(screen.getByText('Pending Claims')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders as a link when href is provided', () => {
    render(
      <DashboardStatCard
        label="Pending Claims"
        count={3}
        icon={BookCheck}
        href="/admin/claims"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/claims');
  });

  it('renders without link when no href', () => {
    render(
      <DashboardStatCard label="Warnings" count={0} icon={BookCheck} />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('displays zero count', () => {
    render(
      <DashboardStatCard label="Empty" count={0} icon={BookCheck} />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
