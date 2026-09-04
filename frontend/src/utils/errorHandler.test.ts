import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  normalizeError,
  handleError,
  handleApiError,
  handleFormError,
  getUserFriendlyMessage,
} from './errorHandler';

describe('Error classes', () => {
  it('AppError has correct statusCode and message', () => {
    const err = new AppError('Test error', 422);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(422);
    expect(err.isOperational).toBe(true);
  });

  it('AppError defaults to statusCode 500', () => {
    expect(new AppError('msg').statusCode).toBe(500);
  });

  it('ValidationError has statusCode 400', () => {
    expect(new ValidationError('Invalid').statusCode).toBe(400);
  });

  it('AuthenticationError has statusCode 401', () => {
    expect(new AuthenticationError().statusCode).toBe(401);
  });

  it('AuthorizationError has statusCode 403', () => {
    expect(new AuthorizationError().statusCode).toBe(403);
  });

  it('NotFoundError has statusCode 404', () => {
    expect(new NotFoundError('Producto').statusCode).toBe(404);
    expect(new NotFoundError('Producto').message).toContain('no encontrado');
  });

  it('NetworkError has statusCode 0', () => {
    expect(new NetworkError().statusCode).toBe(0);
  });
});

describe('normalizeError', () => {
  it('returns AppError unchanged', () => {
    const err = new AppError('test', 400);
    expect(normalizeError(err)).toBe(err);
  });

  it('wraps standard Error in AppError', () => {
    const result = normalizeError(new Error('native error'));
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('native error');
  });

  it('handles axios 400 response as ValidationError', () => {
    const axiosErr = { response: { status: 400, data: { message: 'Bad request' } } };
    const result = normalizeError(axiosErr);
    expect(result).toBeInstanceOf(ValidationError);
  });

  it('handles axios 401 response as AuthenticationError', () => {
    const axiosErr = { response: { status: 401, data: {} } };
    expect(normalizeError(axiosErr)).toBeInstanceOf(AuthenticationError);
  });

  it('handles axios 403 response as AuthorizationError', () => {
    const axiosErr = { response: { status: 403, data: {} } };
    expect(normalizeError(axiosErr)).toBeInstanceOf(AuthorizationError);
  });

  it('handles axios 404 response as NotFoundError', () => {
    const axiosErr = { response: { status: 404, data: {} } };
    expect(normalizeError(axiosErr)).toBeInstanceOf(NotFoundError);
  });

  it('handles axios 500 response as AppError', () => {
    const axiosErr = { response: { status: 500, data: { message: 'Internal error' } } };
    const result = normalizeError(axiosErr);
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Internal error');
  });

  it('handles network errors (no response)', () => {
    const axiosErr = { code: 'ERR_NETWORK', message: 'Network Error' };
    expect(normalizeError(axiosErr)).toBeInstanceOf(NetworkError);
  });

  it('returns generic AppError for unknown errors', () => {
    const result = normalizeError('unexpected string');
    expect(result).toBeInstanceOf(AppError);
    expect(result.statusCode).toBe(500);
  });
});

describe('getUserFriendlyMessage', () => {
  it('returns message for ValidationError', () => {
    expect(getUserFriendlyMessage(new ValidationError('Campo requerido'))).toBe('Campo requerido');
  });

  it('returns auth message for AuthenticationError', () => {
    expect(getUserFriendlyMessage(new AuthenticationError())).toContain('iniciar sesión');
  });

  it('returns permission message for AuthorizationError', () => {
    expect(getUserFriendlyMessage(new AuthorizationError())).toContain('permisos');
  });

  it('returns not found message for NotFoundError', () => {
    expect(getUserFriendlyMessage(new NotFoundError())).toContain('no fue encontrado');
  });

  it('returns connection message for NetworkError', () => {
    expect(getUserFriendlyMessage(new NetworkError())).toContain('conexión');
  });

  it('returns server error message for 5xx', () => {
    expect(getUserFriendlyMessage(new AppError('server err', 500))).toContain('servidor');
  });

  it('returns error message for 4xx other errors', () => {
    const err = new AppError('Bad param', 422);
    expect(getUserFriendlyMessage(err)).toBe('Bad param');
  });
});

describe('handleError', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized AppError', () => {
    const result = handleError(new Error('test'));
    expect(result).toBeInstanceOf(AppError);
  });

  it('accepts optional context string', () => {
    const result = handleError(new ValidationError('bad'), 'test context');
    expect(result).toBeInstanceOf(ValidationError);
  });
});

describe('handleApiError', () => {
  it('returns an AppError with endpoint context', () => {
    const result = handleApiError(new Error('timeout'), '/api/sales', 'GET');
    expect(result).toBeInstanceOf(AppError);
  });
});

describe('handleFormError', () => {
  it('returns an AppError with form context', () => {
    const result = handleFormError(new ValidationError('invalid'), 'LoginForm', 'email');
    expect(result).toBeInstanceOf(AppError);
  });
});
