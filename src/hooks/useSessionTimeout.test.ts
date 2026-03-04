import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from './useSessionTimeout';

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns null and --:-- when lastActivityAt is null', () => {
    const { result } = renderHook(() =>
      useSessionTimeout({
        lastActivityAt: null,
        timeoutMinutes: 5,
        onExpire: vi.fn(),
      })
    );

    expect(result.current.secondsLeft).toBeNull();
    expect(result.current.label).toBe('--:--');
    expect(result.current.isUrgent).toBe(false);
  });

  it('calculates remaining time correctly', () => {
    const now = new Date('2026-03-04T12:00:00Z');
    vi.setSystemTime(now);

    const lastActivity = new Date('2026-03-04T11:58:00Z').toISOString(); // 2 mins ago

    const { result } = renderHook(() =>
      useSessionTimeout({
        lastActivityAt: lastActivity,
        timeoutMinutes: 5,
        onExpire: vi.fn(),
      })
    );

    // 5 mins = 300s. 2 mins elapsed = 120s. Remaining = 180s.
    expect(result.current.secondsLeft).toBe(180);
    expect(result.current.label).toBe('03:00');
    expect(result.current.isUrgent).toBe(false);
  });

  it('triggers onExpire when time runs out', () => {
    const now = new Date('2026-03-04T12:00:00Z');
    vi.setSystemTime(now);

    const lastActivity = new Date('2026-03-04T11:55:00Z').toISOString();
    const onExpire = vi.fn();

    renderHook(() =>
      useSessionTimeout({
        lastActivityAt: lastActivity,
        timeoutMinutes: 5,
        onExpire,
      })
    );

    act(() => {
      vi.advanceTimersByTime(1000); // Trigger the next tick if needed
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
