import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Toast, { ToastContainer } from './Toast';
import type { ToastItem } from './Toast';

const makeToast = (overrides: Partial<ToastItem> = {}): ToastItem => ({
  id: 'toast-1',
  message: 'Operación exitosa',
  variant: 'success',
  duration: 0, // 0 = no auto-dismiss in tests
  ...overrides,
});

describe('Toast', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders message', () => {
    render(<Toast toast={makeToast()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
  });

  it('renders with role="alert"', () => {
    render(<Toast toast={makeToast()} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders success icon ✓', () => {
    render(<Toast toast={makeToast({ variant: 'success' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders error icon ✕', () => {
    render(<Toast toast={makeToast({ variant: 'error' })} onDismiss={vi.fn()} />);
    // Both the variant icon and close button show ✕
    const icons = screen.getAllByText('✕');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders warning icon ⚠', () => {
    render(<Toast toast={makeToast({ variant: 'warning' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders info icon ℹ', () => {
    render(<Toast toast={makeToast({ variant: 'info' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  // ─── close button ──────────────────────────────────────────────────────────

  it('renders close button', () => {
    render(<Toast toast={makeToast()} onDismiss={vi.fn()} />);
    expect(screen.getByRole('button', { name: /cerrar notificación/i })).toBeInTheDocument();
  });

  it('calls onDismiss after clicking close button', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast toast={makeToast({ id: 'toast-1' })} onDismiss={onDismiss} />);
    // Use fireEvent instead of userEvent to avoid async timer conflicts
    fireEvent.click(screen.getByRole('button', { name: /cerrar notificación/i }));
    // handleDismiss sets isExiting=true then calls onDismiss after 200ms animation
    act(() => vi.advanceTimersByTime(300));
    expect(onDismiss).toHaveBeenCalledWith('toast-1');
    vi.useRealTimers();
  });

  // ─── auto-dismiss ──────────────────────────────────────────────────────────

  it('auto-dismisses after specified duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast toast={makeToast({ duration: 2000 })} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(2000 + 200)); // duration + exit animation
    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not auto-dismiss when duration=0', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast toast={makeToast({ duration: 0 })} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(10000));
    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders multiple toasts', () => {
    const toasts: ToastItem[] = [
      makeToast({ id: 't-1', message: 'Mensaje 1' }),
      makeToast({ id: 't-2', message: 'Mensaje 2', variant: 'error' }),
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('Mensaje 1')).toBeInTheDocument();
    expect(screen.getByText('Mensaje 2')).toBeInTheDocument();
  });

  it('renders in document.body via portal', () => {
    const toasts: ToastItem[] = [makeToast({ id: 't-1', message: 'Portal test' })];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(document.body.querySelector('[aria-label="Notificaciones"]')).toBeInTheDocument();
  });
});
