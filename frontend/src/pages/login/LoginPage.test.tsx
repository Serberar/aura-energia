import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mocks ANTES de imports que usan estas dependencias
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));
vi.mock('@/features/auth/services/authService', () => ({
  loginAPI: vi.fn(),
  refreshAPI: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import authReducer from '@/features/auth/authSlice';
import LoginPage from './LoginPage';
import { loginAPI } from '@/features/auth/services/authService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      skore: (s = {}) => s,
      products: (s = {}) => s,
      saleStatus: (s = {}) => s,
      sales: (s = {}) => s,
      clients: (s = {}) => s,
      users: (s = {}) => s,
      allowedIps: (s = {}) => s,
    },
  });
}

function renderLogin() {
  const store = makeStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    ),
  };
}

const MOCK_LOGIN_RESPONSE = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  id: 'user-1',
  firstName: 'Admin',
  lastName: 'Test',
  role: 'administrador',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  // ─── Renderizado ────────────────────────────────────────────────────────────

  it('renders welcome heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
  });

  it('renders username and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
  });

  it('renders login button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders show/hide password toggle button', () => {
    renderLogin();
    expect(
      screen.getByRole('button', { name: /mostrar contraseña/i })
    ).toBeInTheDocument();
  });

  // ─── Estado inicial ─────────────────────────────────────────────────────────

  it('login button is disabled when fields are empty', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeDisabled();
  });

  it('enables login button when both fields have content', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Usuario'), 'admin');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password');

    expect(screen.getByRole('button', { name: /iniciar sesión/i })).not.toBeDisabled();
  });

  // ─── Toggle contraseña ──────────────────────────────────────────────────────

  it('password input is type=password by default', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const toggle = screen.getByRole('button', { name: /mostrar contraseña/i });

    fireEvent.click(toggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─── Submit exitoso ─────────────────────────────────────────────────────────

  it('calls loginAPI with username and password on submit', async () => {
    vi.mocked(loginAPI).mockResolvedValue(MOCK_LOGIN_RESPONSE);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Usuario'), 'admin');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(loginAPI).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      });
    });
  });

  it('navigates to /dashboard on successful login', async () => {
    vi.mocked(loginAPI).mockResolvedValue(MOCK_LOGIN_RESPONSE);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Usuario'), 'admin');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ─── Submit con error ───────────────────────────────────────────────────────

  it('shows error message when login fails', async () => {
    vi.mocked(loginAPI).mockRejectedValue({
      response: { data: { message: 'Credenciales incorrectas' } },
    });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Usuario'), 'bad-user');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'bad-pass');
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('does not navigate when login fails', async () => {
    vi.mocked(loginAPI).mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Usuario'), 'admin');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'wrongpass');
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(loginAPI).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ─── Submit con Enter ───────────────────────────────────────────────────────

  it('submits form when Enter is pressed with both fields filled', async () => {
    vi.mocked(loginAPI).mockResolvedValue(MOCK_LOGIN_RESPONSE);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Usuario'), 'admin');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(loginAPI).toHaveBeenCalledTimes(1);
    });
  });
});
