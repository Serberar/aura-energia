import type { Request, Response } from 'express';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import multer from 'multer';
import type { ICallRepository } from '@domain/repositories/ICallRepository';

const RECORDINGS_DIR = process.env['RECORDINGS_DIR'] ?? join(process.cwd(), 'recordings');

// Ensure recordings directory exists
mkdirSync(RECORDINGS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename:    (req, _file, cb) => cb(null, `${req.params['callId']}.webm`),
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    cb(new Error('Only audio files allowed'));
  },
}).single('recording');

export class RecordingController {
  constructor(private callRepo: ICallRepository) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) { res.status(400).json({ error: 'No file received' }); return; }
    const callId = req.params['callId'] as string;
    const recordingUrl = `/api/calls/${callId}/recording`;
    await this.callRepo.update(callId, { recordingUrl });
    res.json({ ok: true, recordingUrl });
  };

  stream = async (req: Request, res: Response): Promise<void> => {
    const callId = req.params['callId'] as string;
    const filePath = join(RECORDINGS_DIR, `${callId}.webm`);
    if (!existsSync(filePath)) { res.status(404).json({ error: 'Recording not found' }); return; }

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    createReadStream(filePath).pipe(res);
  };
}
