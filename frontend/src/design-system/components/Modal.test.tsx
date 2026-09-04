import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  // ─── Visibilidad ───────────────────────────────────────────────────────────

  it('does not render when isOpen=false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen=true', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument();
  });

  // ─── Título ────────────────────────────────────────────────────────────────

  it('renders title when provided', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Título del modal">
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByText('Título del modal')).toBeInTheDocument();
  });

  it('renders without title when not provided', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Sin título</p>
      </Modal>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  // ─── Botón cerrar ──────────────────────────────────────────────────────────

  it('shows close button by default', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Modal">
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: /cerrar modal/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Modal">
        <p>Contenido</p>
      </Modal>
    );
    fireEvent.click(screen.getByRole('button', { name: /cerrar modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides close button when showCloseButton=false', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Modal" showCloseButton={false}>
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.queryByRole('button', { name: /cerrar modal/i })).not.toBeInTheDocument();
  });

  // ─── Cerrar con overlay ────────────────────────────────────────────────────

  it('calls onClose when clicking on overlay (closeOnOverlayClick=true default)', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Contenido</p>
      </Modal>
    );
    // Click on the overlay (the dialog element itself, not its children)
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when clicking inside the modal content', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p data-testid="content">Contenido</p>
      </Modal>
    );
    fireEvent.click(screen.getByTestId('content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose on overlay click when closeOnOverlayClick=false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} closeOnOverlayClick={false}>
        <p>Contenido</p>
      </Modal>
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Cerrar con ESC ────────────────────────────────────────────────────────

  it('calls onClose when pressing Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Contenido</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closeOnEscape=false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} closeOnEscape={false}>
        <p>Contenido</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Footer ────────────────────────────────────────────────────────────────

  it('renders footer when provided', () => {
    render(
      <Modal isOpen onClose={vi.fn()} footer={<button>Aceptar</button>}>
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
  });

  // ─── Accesibilidad ─────────────────────────────────────────────────────────

  it('has aria-modal attribute', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('sets aria-labelledby when title is provided', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Mi modal">
        <p>Contenido</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
