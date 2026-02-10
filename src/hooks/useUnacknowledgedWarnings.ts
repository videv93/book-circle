'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { getUnacknowledgedWarnings } from '@/actions/user/getUnacknowledgedWarnings';
import type { UserWarning } from '@prisma/client';

export function useUnacknowledgedWarnings() {
  const { data: session } = useSession();
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    let cancelled = false;

    async function fetchWarnings() {
      if (!userId) {
        setWarnings([]);
        setLoading(false);
        return;
      }

      const result = await getUnacknowledgedWarnings();
      if (!cancelled) {
        if (result.success) {
          setWarnings(result.data);
        }
        setLoading(false);
      }
    }

    fetchWarnings();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setWarnings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getUnacknowledgedWarnings();
    if (result.success) {
      setWarnings(result.data);
    }
    setLoading(false);
  }, [userId]);

  return { warnings, loading, refresh };
}
