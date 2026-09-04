import { Request, Response, NextFunction } from 'express';
import { serviceContainer } from '@infrastructure/container/ServiceContainer';
import { AuthenticationError, ValidationError } from '@application/shared/AppError';

/** Claves permitidas de configuración (whitelist explícita) */
const ALLOWED_KEYS = new Set([
  'firma_requerida',
  'calls_module_enabled',
  'crm_module_enabled',
  'firma_module_enabled',
  'crm_online_search_enabled',
]);

/** Valor por defecto de cada clave cuando aún no está persistida */
const KEY_DEFAULTS: Record<string, boolean> = {
  firma_requerida:           true,
  calls_module_enabled:      true,
  crm_module_enabled:        true,
  firma_module_enabled:      false,
  crm_online_search_enabled: false,
};

export class SettingsController {
  // GET /api/settings/:key
  static async getSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user;
      if (!currentUser) throw new AuthenticationError('No autorizado');

      const { key } = req.params;
      if (!ALLOWED_KEYS.has(key)) {
        return res.status(404).json({ message: `Configuración '${key}' no encontrada` });
      }

      const value = await serviceContainer.getSystemSettingUseCase.executeAsBool(key, KEY_DEFAULTS[key] ?? true);
      res.status(200).json({ key, value });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/settings/:key
  static async setSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user;
      if (!currentUser) throw new AuthenticationError('No autorizado');

      const { key } = req.params;
      if (!ALLOWED_KEYS.has(key)) {
        return res.status(404).json({ message: `Configuración '${key}' no encontrada` });
      }

      const { value } = req.body;
      if (typeof value !== 'boolean') {
        throw new ValidationError('El campo value debe ser un booleano');
      }

      await serviceContainer.setSystemSettingUseCase.execute(key, String(value), currentUser);
      res.status(200).json({ key, value });
    } catch (error) {
      next(error);
    }
  }
}
