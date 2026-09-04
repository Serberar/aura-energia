import { Request, Response } from 'express';
import { serviceContainer } from '@infrastructure/container/ServiceContainer';
import logger from '@infrastructure/observability/logger/logger';
import type { AuthRequest } from '@infrastructure/express/middleware/authMiddleware';
import {
  setAuthCookies,
  setAccessTokenCookie,
  clearAuthCookies,
  isCookieAuthEnabled,
  COOKIE_NAMES,
} from '@infrastructure/express/utils/cookieAuth';
import { generateToken } from '@infrastructure/express/middleware/csrfMiddleware';
import { AppError } from '@application/shared/AppError';

function requireRole(req: Request, res: Response, ...roles: string[]): boolean {
  const caller = (req as AuthRequest).user;
  if (!caller || !roles.includes(caller.role)) {
    res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    return false;
  }
  return true;
}

function errorStatus(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}

// Tipos para los datos de entrada
interface RegisterBody {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: 'administrador' | 'comercial' | 'gestor';
}

interface LoginBody {
  username: string;
  password: string;
}

interface RefreshTokenBody {
  refreshToken?: string; // Hacerlo opcional
}

export class UserController {
  static async getAll(req: Request, res: Response) {
    if (!requireRole(req, res, 'administrador', 'coordinador')) return;
    try {
      const users = await serviceContainer.getAllUsersUseCase.execute();
      res.status(200).json(users);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener usuarios';
      res.status(errorStatus(error)).json({ error: errorMessage });
    }
  }

  static async delete(req: Request, res: Response) {
    if (!requireRole(req, res, 'administrador')) return;
    const caller = (req as AuthRequest).user!;
    const { id } = req.params;
    if (caller.id === id) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      return;
    }
    try {
      await serviceContainer.deleteUserUseCase.execute(id);
      res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario';
      res.status(errorStatus(error)).json({ error: errorMessage });
    }
  }

  static async update(req: Request, res: Response) {
    const caller = (req as AuthRequest).user;
    if (!caller) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const { id } = req.params;
    const isAdmin = caller.role === 'administrador';

    // Usuarios no-admin solo pueden editar su propio perfil
    if (!isAdmin && caller.id !== id) {
      res.status(403).json({ error: 'No tienes permisos para modificar este usuario' });
      return;
    }

    // Filtrar campos sensibles para no-admin
    const updateData = isAdmin
      ? req.body
      : (({ role: _r, active: _a, ...rest }) => rest)(req.body);

    try {
      const user = await serviceContainer.updateUserUseCase.execute(id, updateData);
      res.status(200).json({ user, message: 'Usuario actualizado correctamente' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario';
      res.status(errorStatus(error)).json({ error: errorMessage });
    }
  }

  static async register(req: Request, res: Response) {
    const caller = (req as AuthRequest).user;
    if (!caller || caller.role !== 'administrador') {
      res.status(403).json({ error: 'Solo los administradores pueden crear usuarios' });
      return;
    }
    try {
      const userData = req.body as RegisterBody;
      const user = await serviceContainer.registerUserUseCase.execute({
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password: userData.password,
        role: userData.role,
      });
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
        },
        message: 'Usuario creado correctamente',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
      res.status(400).json({ error: errorMessage });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const loginData = req.body as LoginBody;
      const { user, accessToken, refreshToken } = await serviceContainer.loginUserUseCase.execute({
        username: loginData.username,
        password: loginData.password,
      });

      // Preparar respuesta base
      const responseData = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      // Si USE_COOKIE_AUTH está habilitado, enviar tokens como httpOnly cookies
      if (isCookieAuthEnabled()) {
        setAuthCookies(res, accessToken, refreshToken);

        // Generar y enviar CSRF token para protección
        const csrfToken = generateToken(req, res);

        res.status(200).json({
          ...responseData,
          csrfToken, // El frontend debe enviar esto en header X-CSRF-Token
        });
      } else {
        // Modo tradicional: tokens en el cuerpo de la respuesta
        res.status(200).json({
          ...responseData,
          accessToken,
          refreshToken,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Usuario o contraseña incorrectos';
      res.status(401).json({ error: errorMessage });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      let refreshTokenValue: string | undefined;

      // Si usamos cookies, obtener el refresh token de la cookie
      if (isCookieAuthEnabled()) {
        refreshTokenValue = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
      } else {
        // Modo tradicional: del body
        const refreshData = req.body as RefreshTokenBody;
        refreshTokenValue = refreshData.refreshToken;
      }

      if (!refreshTokenValue) {
        return res.status(401).json({ error: 'Refresh token no enviado' });
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await serviceContainer.refreshTokenUseCase.execute(refreshTokenValue);

      if (isCookieAuthEnabled()) {
        setAuthCookies(res, accessToken, newRefreshToken);
        res.status(200).json({ message: 'Token actualizado' });
      } else {
        res.status(200).json({ accessToken, refreshToken: newRefreshToken });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh token inválido';
      res.status(401).json({ error: errorMessage });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      // Sanitizar headers antes de loguear (excluir tokens y cookies)
      const sanitizedHeaders = { ...req.headers };
      delete sanitizedHeaders.authorization;
      delete sanitizedHeaders.cookie;

      logger.debug('Logout request headers', { headers: sanitizedHeaders });
      logger.debug('Logout request metadata', {
        contentType: req.get('Content-Type'),
        method: req.method,
        url: req.url,
      });

      let refreshTokenValue: string | undefined;

      // Obtener refresh token de cookie o body
      if (isCookieAuthEnabled()) {
        refreshTokenValue = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
      } else {
        const logoutData = req.body as RefreshTokenBody;
        refreshTokenValue = logoutData.refreshToken;
      }

      logger.debug('Logout data received', {
        hasRefreshToken: !!refreshTokenValue,
      });

      if (refreshTokenValue) {
        await serviceContainer.logoutUserUseCase.execute(refreshTokenValue);
      }

      // Limpiar cookies si están habilitadas
      if (isCookieAuthEnabled()) {
        clearAuthCookies(res);
      }

      logger.info('Logout successful');
      res.status(200).json({ message: 'Sesión cerrada' });
    } catch (error) {
      logger.error('Error during logout', { error });

      // Aún así limpiar cookies
      if (isCookieAuthEnabled()) {
        clearAuthCookies(res);
      }

      res.status(200).json({ message: 'Sesión cerrada' });
    }
  }
}
