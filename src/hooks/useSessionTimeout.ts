import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseSessionTimeoutOptions {
  /**
   * The last_activity_at timestamp from the game row (ISO string).
   * When this value changes the countdown resets.
   */
  lastActivityAt: string | null | undefined;
  /** Timeout threshold in minutes. */
  timeoutMinutes: number;
  /** Called once when the timeout elapses (only on the local client). */
  onExpire: () => void;
}

interface UseSessionTimeoutReturn {
  /** Remaining seconds until timeout. null while lastActivityAt is unknown. */
  secondsLeft: number | null;
  /** Human-readable mm:ss label, e.g. "14:32" */
  label: string;
  /** true when ≤ 60 seconds remain */
  isUrgent: boolean;
}

/**
 * Drives a client-side countdown based on game.last_activity_at.
 * Every 60 seconds it also calls expire_stale_sessions() so the backend
 * stays in sync even without pg_cron.
 */
export function useSessionTimeout({
  lastActivityAt,
  timeoutMinutes,
  onExpire,
}: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const expiredRef = useRef(false);
  const expireCalledRef = useRef(false);
  // Track when we last called the RPC to avoid hammering the DB
  const lastRpcCallRef = useRef<number>(0);

  useEffect(() => {
    if (!lastActivityAt) return;

    expiredRef.current = false;
    expireCalledRef.current = false;

    const thresholdMs = timeoutMinutes * 60 * 1000;

    const tick = () => {
      const elapsed = Date.now() - new Date(lastActivityAt).getTime();
      const remaining = Math.max(0, Math.floor((thresholdMs - elapsed) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0 && !expireCalledRef.current) {
        expireCalledRef.current = true;
        onExpire();
      }

      // Call the RPC at most once per 60 seconds to expire stale sessions
      const now = Date.now();
      if (now - lastRpcCallRef.current >= 60_000) {
        lastRpcCallRef.current = now;
        supabase.rpc('expire_stale_sessions').then(({ error }) => {
          if (error) console.warn('expire_stale_sessions error:', error.message);
        });
      }
    };

    tick(); // immediate first tick
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastActivityAt, timeoutMinutes, onExpire]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
  const label =
    secondsLeft !== null
      ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : '--:--';

  return {
    secondsLeft,
    label,
    isUrgent: secondsLeft !== null && secondsLeft <= 60,
  };
}
