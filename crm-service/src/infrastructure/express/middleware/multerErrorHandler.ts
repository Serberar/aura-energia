import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function multerErrorHandler(
  maxSizeMB: number
): (err: unknown, req: Request, res: Response, next: NextFunction) => void {
  return (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ message: `El fichero es demasiado grande. Tamaño máximo: ${maxSizeMB} MB.` });
        return;
      }
      res.status(400).json({ message: `Error al subir fichero: ${err.message}` });
      return;
    }
    if (err instanceof Error && err.message.includes('Tipo de imagen')) {
      res.status(400).json({ message: err.message });
      return;
    }
    next(err);
  };
}
