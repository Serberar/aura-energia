import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../services/signatureService', () => ({
  sendContract: vi.fn(),
  resendContract: vi.fn(),
  cancelSignature: vi.fn(),
  getSignatureStatus: vi.fn(),
  simulateSign: vi.fn(),
}));

import { useSignature } from './useSignature';
import * as signatureServiceMod from '../services/signatureService';

const mockSendContract    = signatureServiceMod.sendContract    as ReturnType<typeof vi.fn>;
const mockResendContract  = signatureServiceMod.resendContract  as ReturnType<typeof vi.fn>;
const mockCancelSignature = signatureServiceMod.cancelSignature as ReturnType<typeof vi.fn>;

const mockSignatureRequest = {
  id: 'sig-1',
  saleId: 'sale-1',
  signerEmail: 'cliente@example.com',
  status: 'pending' as const,
  providerDocumentId: 'doc-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('useSignature', () => {
  beforeEach(() => vi.clearAllMocks());

  it('initializes with loading=false and error=null', () => {
    const { result } = renderHook(() => useSignature());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── send ───────────────────────────────────────────────────────────────────

  describe('send', () => {
    it('returns signatureRequest on success', async () => {
      mockSendContract.mockResolvedValue(mockSignatureRequest);
      const { result } = renderHook(() => useSignature());

      let returned: any;
      await act(async () => {
        returned = await result.current.send('sale-1', 'cliente@example.com');
      });

      expect(returned).toEqual(mockSignatureRequest);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('calls sendContract with correct args', async () => {
      mockSendContract.mockResolvedValue(mockSignatureRequest);
      const { result } = renderHook(() => useSignature());

      await act(async () => {
        await result.current.send('sale-1', 'test@test.com');
      });

      expect(mockSendContract).toHaveBeenCalledWith('sale-1', 'test@test.com', undefined);
    });

    it('sets error and returns null on failure', async () => {
      mockSendContract.mockRejectedValue(new Error('Sale not found'));
      const { result } = renderHook(() => useSignature());

      let returned: any;
      await act(async () => {
        returned = await result.current.send('sale-1', 'test@test.com');
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBe('Sale not found');
      expect(result.current.loading).toBe(false);
    });

    it('resets loading to false after success', async () => {
      mockSendContract.mockResolvedValue(mockSignatureRequest);
      const { result } = renderHook(() => useSignature());

      await act(async () => {
        await result.current.send('sale-1', 'test@test.com');
      });

      expect(result.current.loading).toBe(false);
    });
  });

  // ─── resend ─────────────────────────────────────────────────────────────────

  describe('resend', () => {
    it('returns signatureRequest on success', async () => {
      mockResendContract.mockResolvedValue(mockSignatureRequest);
      const { result } = renderHook(() => useSignature());

      let returned: any;
      await act(async () => {
        returned = await result.current.resend('sale-1', 'nuevo@example.com');
      });

      expect(returned).toEqual(mockSignatureRequest);
    });

    it('calls resendContract without email when not provided', async () => {
      mockResendContract.mockResolvedValue(mockSignatureRequest);
      const { result } = renderHook(() => useSignature());

      await act(async () => {
        await result.current.resend('sale-1');
      });

      expect(mockResendContract).toHaveBeenCalledWith('sale-1', undefined);
    });

    it('sets error and returns null on failure', async () => {
      mockResendContract.mockRejectedValue(new Error('No pending signature'));
      const { result } = renderHook(() => useSignature());

      let returned: any;
      await act(async () => {
        returned = await result.current.resend('sale-1');
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBe('No pending signature');
    });
  });

  // ─── cancel ─────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('returns true on success', async () => {
      mockCancelSignature.mockResolvedValue(undefined);
      const { result } = renderHook(() => useSignature());

      let returned: any;
      await act(async () => {
        returned = await result.current.cancel('sale-1');
      });

      expect(returned).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('calls cancelSignature with correct saleId', async () => {
      mockCancelSignature.mockResolvedValue(undefined);
      const { result } = renderHook(() => useSignature());

      await act(async () => {
        await result.current.cancel('sale-1');
      });

      expect(mockCancelSignature).toHaveBeenCalledWith('sale-1');
    });

    it('sets error and returns false on failure', async () => {
      mockCancelSignature.mockRejectedValue(new Error('Already signed'));
      const { result } = renderHook(() => useSignature());

      let returned: any;
      await act(async () => {
        returned = await result.current.cancel('sale-1');
      });

      expect(returned).toBe(false);
      expect(result.current.error).toBe('Already signed');
      expect(result.current.loading).toBe(false);
    });
  });
});
