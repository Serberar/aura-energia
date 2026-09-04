import { Router } from 'express';
import { ContractTemplateController } from '@infrastructure/express/controllers/ContractTemplateController';
import { authMiddleware } from '@infrastructure/express/middleware/authMiddleware';
import { uploadTemplateLogo } from '@infrastructure/express/middleware/uploadMiddleware';
import { multerErrorHandler } from '@infrastructure/express/middleware/multerErrorHandler';

const router = Router();

// GET /api/contract-templates
router.get('/', authMiddleware, ContractTemplateController.list);

// POST /api/contract-templates
router.post('/', authMiddleware, ContractTemplateController.create);

// GET /api/contract-templates/:id
router.get('/:id', authMiddleware, ContractTemplateController.getOne);

// PATCH /api/contract-templates/:id
router.patch('/:id', authMiddleware, ContractTemplateController.update);

// DELETE /api/contract-templates/:id
router.delete('/:id', authMiddleware, ContractTemplateController.remove);

// GET /api/contract-templates/:id/logo
router.get('/:id/logo', authMiddleware, ContractTemplateController.getLogo);

// POST /api/contract-templates/:id/logo
router.post(
  '/:id/logo',
  authMiddleware,
  uploadTemplateLogo.single('logo'),
  multerErrorHandler(5),
  ContractTemplateController.uploadLogo
);

// DELETE /api/contract-templates/:id/logo
router.delete('/:id/logo', authMiddleware, ContractTemplateController.deleteLogo);

export default router;
