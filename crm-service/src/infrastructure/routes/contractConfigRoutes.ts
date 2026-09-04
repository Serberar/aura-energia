import { Router } from 'express';
import { ContractConfigController } from '@infrastructure/express/controllers/ContractConfigController';
import { authMiddleware } from '@infrastructure/express/middleware/authMiddleware';
import { uploadLogo } from '@infrastructure/express/middleware/uploadMiddleware';
import { multerErrorHandler } from '@infrastructure/express/middleware/multerErrorHandler';

const router = Router();

// GET /api/contract-config — leer configuración completa
router.get('/', authMiddleware, ContractConfigController.getConfig);

// PATCH /api/contract-config — guardar textos / páginas extra
router.patch('/', authMiddleware, ContractConfigController.saveConfig);

// GET /api/contract-config/logo — servir el fichero de logo
router.get('/logo', authMiddleware, ContractConfigController.getLogo);

// POST /api/contract-config/logo — subir nuevo logo
router.post(
  '/logo',
  authMiddleware,
  uploadLogo.single('logo'),
  multerErrorHandler(2),
  ContractConfigController.uploadLogo
);

// DELETE /api/contract-config/logo — eliminar logo
router.delete('/logo', authMiddleware, ContractConfigController.deleteLogo);

export default router;
