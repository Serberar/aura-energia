import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/crmApi';
import {
  listRecordings,
  uploadRecording,
  downloadRecording,
  deleteRecording,
  isAudio,
  isVideo,
} from './recordingService';
import { formatFileSize } from '@/utils/crm/formatters';
import type { Recording } from '@/types/sales';

const mockApi = api as any;

const mockRecording: Recording = {
  id: 'rec-1',
  saleId: 'sale-1',
  filename: 'test-uuid.mp3',
  originalName: 'grabacion.mp3',
  mimeType: 'audio/mpeg',
  size: 1024000,
  uploadedById: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('recordingService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── listRecordings ──────────────────────────────────────────────────────────

  describe('listRecordings', () => {
    it('calls GET .../recordings and returns array', async () => {
      mockApi.get.mockResolvedValue({ data: [mockRecording] });

      const result = await listRecordings('sale-1');

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sales/sale-1/recordings'));
      expect(result).toEqual([mockRecording]);
    });

    it('returns empty array when no recordings', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      expect(await listRecordings('sale-1')).toEqual([]);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(listRecordings('sale-1')).rejects.toThrow('Not found');
    });
  });

  // ─── uploadRecording ─────────────────────────────────────────────────────────

  describe('uploadRecording', () => {
    it('calls POST .../recordings with FormData and returns recording', async () => {
      mockApi.post.mockResolvedValue({ data: { recording: mockRecording } });
      const file = new File(['audio content'], 'grabacion.mp3', { type: 'audio/mpeg' });

      const result = await uploadRecording('sale-1', file);

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/recordings'),
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
      expect(result).toEqual(mockRecording);
    });

    it('appends file to FormData', async () => {
      mockApi.post.mockResolvedValue({ data: { recording: mockRecording } });
      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

      await uploadRecording('sale-1', file);

      const formData: FormData = mockApi.post.mock.calls[0][1];
      expect(formData.has('file')).toBe(true);
    });

    it('calls onProgress callback when provided', async () => {
      const onProgress = vi.fn();
      mockApi.post.mockImplementation((_url: string, _data: FormData, options: any) => {
        options.onUploadProgress({ loaded: 50, total: 100 });
        return Promise.resolve({ data: { recording: mockRecording } });
      });

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      await uploadRecording('sale-1', file, onProgress);

      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('File too large'));
      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      await expect(uploadRecording('sale-1', file)).rejects.toThrow('File too large');
    });
  });

  // ─── downloadRecording ───────────────────────────────────────────────────────

  describe('downloadRecording', () => {
    it('calls GET .../recordings/:id with blob responseType', async () => {
      // Mock DOM APIs for download
      const mockUrl = 'blob:http://localhost/test';
      const mockLink = { href: '', setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl);
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);

      mockApi.get.mockResolvedValue({ data: new Blob(['audio']) });

      await downloadRecording('sale-1', 'rec-1', 'grabacion.mp3');

      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/recordings/rec-1'),
        { responseType: 'blob' }
      );
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'grabacion.mp3');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(downloadRecording('sale-1', 'rec-1', 'test.mp3')).rejects.toThrow('Not found');
    });
  });

  // ─── deleteRecording ─────────────────────────────────────────────────────────

  describe('deleteRecording', () => {
    it('calls DELETE .../recordings/:id', async () => {
      mockApi.delete.mockResolvedValue({ data: {} });

      await deleteRecording('sale-1', 'rec-1');

      expect(mockApi.delete).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/recordings/rec-1')
      );
    });

    it('throws when API fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Not found'));
      await expect(deleteRecording('sale-1', 'rec-1')).rejects.toThrow('Not found');
    });
  });

  // ─── pure utility functions ───────────────────────────────────────────────────

  describe('formatFileSize', () => {
    it('returns "0 Bytes" for 0', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('formats KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('formats MB correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('formats decimal MB correctly', () => {
      expect(formatFileSize(1536000)).toContain('MB');
    });
  });

  describe('isAudio', () => {
    it('returns true for audio/mpeg', () => expect(isAudio('audio/mpeg')).toBe(true));
    it('returns true for audio/wav', () => expect(isAudio('audio/wav')).toBe(true));
    it('returns false for video/mp4', () => expect(isAudio('video/mp4')).toBe(false));
    it('returns false for image/jpeg', () => expect(isAudio('image/jpeg')).toBe(false));
  });

  describe('isVideo', () => {
    it('returns true for video/mp4', () => expect(isVideo('video/mp4')).toBe(true));
    it('returns true for video/webm', () => expect(isVideo('video/webm')).toBe(true));
    it('returns false for audio/mpeg', () => expect(isVideo('audio/mpeg')).toBe(false));
    it('returns false for image/png', () => expect(isVideo('image/png')).toBe(false));
  });
});
