import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import { useAsyncState } from './useAsyncState';

describe('useAsyncState', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAsyncState());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  it('initialLoading option sets initial isLoading', () => {
    const { result } = renderHook(() => useAsyncState({ initialLoading: true }));

    expect(result.current.isLoading).toBe(true);
  });

  // ─── setLoading ────────────────────────────────────────────────────────────

  it('setLoading(true) sets isLoading and clears messages', () => {
    const { result } = renderHook(() => useAsyncState());

    act(() => { result.current.setSuccess('Done'); });
    act(() => { result.current.setLoading(true); });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.success).toBeNull();
  });

  it('setLoading(false) sets isLoading to false', () => {
    const { result } = renderHook(() => useAsyncState({ initialLoading: true }));

    act(() => { result.current.setLoading(false); });

    expect(result.current.isLoading).toBe(false);
  });

  // ─── setError ──────────────────────────────────────────────────────────────

  it('setError with string sets error message', () => {
    const { result } = renderHook(() => useAsyncState());

    act(() => { result.current.setError('Something went wrong'); });

    expect(result.current.error).toBe('Something went wrong');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBeNull();
  });

  it('setError with Error object normalizes the message', () => {
    const { result } = renderHook(() => useAsyncState());

    act(() => { result.current.setError(new Error('Network error')); });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it('setError calls onError callback', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useAsyncState({ onError }));

    act(() => { result.current.setError('Bad request'); });

    expect(onError).toHaveBeenCalledWith('Bad request');
  });

  // ─── setSuccess ────────────────────────────────────────────────────────────

  it('setSuccess sets success message and clears error', () => {
    const { result } = renderHook(() => useAsyncState());

    act(() => { result.current.setError('old error'); });
    act(() => { result.current.setSuccess('Guardado!'); });

    expect(result.current.success).toBe('Guardado!');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('setSuccess uses default message when none provided', () => {
    const { result } = renderHook(() => useAsyncState());

    act(() => { result.current.setSuccess(); });

    expect(result.current.success).toBeTruthy();
  });

  it('setSuccess uses successMessage option when no argument', () => {
    const { result } = renderHook(() => useAsyncState({ successMessage: 'Operación OK' }));

    act(() => { result.current.setSuccess(); });

    expect(result.current.success).toBe('Operación OK');
  });

  it('setSuccess calls onSuccess callback', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsyncState({ onSuccess }));

    act(() => { result.current.setSuccess('Done'); });

    expect(onSuccess).toHaveBeenCalled();
  });

  // ─── clearMessages ─────────────────────────────────────────────────────────

  it('clearMessages clears error and success', () => {
    const { result } = renderHook(() => useAsyncState());

    act(() => {
      result.current.setError('error');
    });
    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  // ─── reset ─────────────────────────────────────────────────────────────────

  it('reset returns to initial state', () => {
    const { result } = renderHook(() => useAsyncState({ initialLoading: true }));

    act(() => { result.current.setError('oops'); });
    act(() => { result.current.reset(); });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  // ─── execute ───────────────────────────────────────────────────────────────

  describe('execute', () => {
    it('sets loading=true during execution, returns result', async () => {
      const { result } = renderHook(() => useAsyncState());

      let returned: any;
      await act(async () => {
        returned = await result.current.execute(async () => 'ok');
      });

      expect(returned).toBe('ok');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.success).toBeTruthy();
    });

    it('returns null and sets error on failure', async () => {
      const { result } = renderHook(() => useAsyncState());

      let returned: any;
      await act(async () => {
        returned = await result.current.execute(async () => {
          throw new Error('fetch failed');
        });
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('calls onSuccess callback with result', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAsyncState());

      await act(async () => {
        await result.current.execute(async () => 42, { onSuccess });
      });

      expect(onSuccess).toHaveBeenCalledWith(42);
    });

    it('uses custom successMessage from execute config', async () => {
      const { result } = renderHook(() => useAsyncState());

      await act(async () => {
        await result.current.execute(async () => 'done', { successMessage: 'Custom!' });
      });

      expect(result.current.success).toBe('Custom!');
    });
  });
});
