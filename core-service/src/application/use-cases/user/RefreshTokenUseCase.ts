import jwt from 'jsonwebtoken';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { AuthenticationError } from '@application/shared/AppError';

export class RefreshTokenUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(refreshToken: string) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)
      throw new AuthenticationError('Configuración de JWT no disponible');

    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as {
        id: string;
        role: string;
        firstName: string;
      };
      const user = await this.userRepository.findById(payload.id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new AuthenticationError('Token inválido');
      }

      if (!user.active) {
        throw new AuthenticationError('Cuenta desactivada');
      }

      const accessToken = jwt.sign(
        { id: user.id, role: user.role, firstName: user.firstName },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Rotación: emitir nuevo refresh token e invalidar el anterior
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
      const newRefreshToken = jwt.sign(
        { id: user.id, role: user.role, firstName: user.firstName },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: refreshExpiresIn }
      );
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.userRepository.saveRefreshToken(user.id, newRefreshToken, expiresAt);

      return { accessToken, refreshToken: newRefreshToken, user };
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        throw err;
      }
      throw new AuthenticationError('Refresh token inválido o expirado');
    }
  }
}
