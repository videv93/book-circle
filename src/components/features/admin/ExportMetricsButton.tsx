'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExportMetricsButton() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const queryString = params.toString();
      const exportUrl = `/api/admin/export/metrics${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `platform-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      console.error('Failed to export metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="min-h-[44px]"
    >
      <Download className="mr-2 h-4 w-4" />
      {loading ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
