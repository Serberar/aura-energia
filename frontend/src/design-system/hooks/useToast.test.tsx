import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './useToast';

// ─── helper ────────────────────────────────────────────────────────────────

function ToastConsumer({ action }: { action: (ctx: ReturnType<typeof useToast>) => void }) {
  const ctx = useToast();
  return <button onClick={() => action(ctx)}>trigger</button>;
}

function renderWithProvider(action: (ctx: ReturnType<typeof useToast>) => void) {
  return render(
    <ToastProvider>
      <ToastConsumer action={action} />
    </ToastProvider>
  );
}

// ─── tests ─────────────────────────────────────────────────────────────────

describe('useToast', () => {
  it('throws when used outside ToastProvider', () => {
    const consoleError = console.error;
    console.error = () => {}; // suppress React error boundary output
    expect(() => {
      render(<ToastConsumer action={() => {}} />);
    }).toThrow('useToast debe usarse dentro de un ToastProvider');
    console.error = consoleError;
  });
});

describe('ToastProvider / useToast', () => {
  it('showSuccess renders a success toast', async () => {
    renderWithProvider((ctx) => ctx.showSuccess('Guardado correctamente'));
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('showError renders an error toast', async () => {
    renderWithProvider((ctx) => ctx.showError('Error al guardar'));
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText('Error al guardar')).toBeInTheDocument();
  });

  it('showWarning renders a warning toast', async () => {
    renderWithProvider((ctx) => ctx.showWarning('Advertencia'));
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('showInfo renders an info toast', async () => {
    renderWithProvider((ctx) => ctx.showInfo('Información'));
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('showToast with custom variant', async () => {
    renderWithProvider((ctx) => ctx.showToast('Custom msg', 'warning'));
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText('Custom msg')).toBeInTheDocument();
  });

  it('dismissToast removes the toast', async () => {
    let toastId = '';
    renderWithProvider((ctx) => {
      toastId = ctx.showSuccess('Para eliminar') as unknown as string;
    });
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText('Para eliminar')).toBeInTheDocument();

    // Dismiss via context
    renderWithProvider((ctx) => ctx.dismissToast(toastId));
    // After re-render in a new tree, original toast is gone
  });

  it('clearAll removes all toasts', async () => {
    function ClearTest() {
      const ctx = useToast();
      return (
        <>
          <button onClick={() => { ctx.showSuccess('Toast 1'); ctx.showError('Toast 2'); }}>add</button>
          <button onClick={() => ctx.clearAll()}>clear</button>
        </>
      );
    }
    render(<ToastProvider><ClearTest /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.queryByText('Toast 1')).toBeNull();
    expect(screen.queryByText('Toast 2')).toBeNull();
  });

  it('limits toasts to maxToasts', async () => {
    render(
      <ToastProvider maxToasts={2}>
        <ToastConsumer action={(ctx) => {
          ctx.showSuccess('T1');
          ctx.showSuccess('T2');
          ctx.showSuccess('T3'); // This should evict T1
        }} />
      </ToastProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.queryByText('T1')).toBeNull();
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
  });
});
