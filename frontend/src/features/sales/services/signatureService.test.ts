import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/crmApi';
import {
  sendContract,
  resendContract,
  getSignatureStatus,
  cancelSignature,
  simulateSign,
} from './signatureService';
import type { SignatureRequest } from '@/types/sales';

const mockApi = api as any;

const mockSignatureRequest: SignatureRequest = {
  id: 'sig-1',
  saleId: 'sale-1',
  signerEmail: 'cliente@example.com',
  status: 'pending',
  providerDocumentId: 'doc-123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('signatureService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('sendContract', () => {
    it('calls POST .../signature/send with signerEmail and returns signatureRequest', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Sent', signatureRequest: mockSignatureRequest } });

      const result = await sendContract('sale-1', 'cliente@example.com');

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/signature/send'),
        { signerEmail: 'cliente@example.com' }
      );
      expect(result).toEqual(mockSignatureRequest);
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Sale not found'));
      await expect(sendContract('non-existent', 'mail@test.com')).rejects.toThrow('Sale not found');
    });
  });

  describe('resendContract', () => {
    it('calls POST .../signature/resend with signerEmail when provided', async () => {
      mockApi.post.mockResolvedValue({ data: { signatureRequest: mockSignatureRequest } });

      await resendContract('sale-1', 'nuevo@example.com');

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/signature/resend'),
        { signerEmail: 'nuevo@example.com' }
      );
    });

    it('calls POST with empty body when no signerEmail provided', async () => {
      mockApi.post.mockResolvedValue({ data: { signatureRequest: mockSignatureRequest } });

      await resendContract('sale-1');

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/signature/resend'),
        {}
      );
    });

    it('returns signatureRequest', async () => {
      mockApi.post.mockResolvedValue({ data: { signatureRequest: mockSignatureRequest } });
      const result = await resendContract('sale-1');
      expect(result).toEqual(mockSignatureRequest);
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('No pending signature'));
      await expect(resendContract('sale-1')).rejects.toThrow('No pending signature');
    });
  });

  describe('getSignatureStatus', () => {
    it('calls GET .../signature and returns signatureRequest', async () => {
      mockApi.get.mockResolvedValue({ data: mockSignatureRequest });

      const result = await getSignatureStatus('sale-1');

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/signature'));
      expect(result).toEqual(mockSignatureRequest);
    });

    it('returns null when no signature exists', async () => {
      mockApi.get.mockResolvedValue({ data: null });
      const result = await getSignatureStatus('sale-1');
      expect(result).toBeNull();
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(getSignatureStatus('sale-1')).rejects.toThrow('Not found');
    });
  });

  describe('cancelSignature', () => {
    it('calls DELETE .../signature', async () => {
      mockApi.delete.mockResolvedValue({ data: {} });

      await cancelSignature('sale-1');

      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/signature'));
    });

    it('throws when API fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Already signed'));
      await expect(cancelSignature('sale-1')).rejects.toThrow('Already signed');
    });
  });

  describe('simulateSign', () => {
    it('calls POST /signature/webhook with event data', async () => {
      mockApi.post.mockResolvedValue({ data: {} });

      await simulateSign('doc-123');

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/signature/webhook'),
        expect.objectContaining({
          providerDocumentId: 'doc-123',
          event: 'signed',
        })
      );
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Server error'));
      await expect(simulateSign('doc-123')).rejects.toThrow('Server error');
    });
  });
});
