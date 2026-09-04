import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import callsReducer from '@/features/calls/callsSlice';
import DialerPage from '../DialerPage';

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@/features/calls/services/dialerService', () => ({
  listDialLists:      vi.fn().mockResolvedValue([]),
  createDialList:     vi.fn().mockResolvedValue({ id: 'list-1', name: 'Campaña Test', status: 'draft' }),
  updateDialList:     vi.fn().mockResolvedValue({ id: 'list-1', name: 'Campaña Test', status: 'active' }),
  deleteDialList:     vi.fn().mockResolvedValue({}),
  getNextEntry:       vi.fn().mockResolvedValue(null),
  skipEntry:          vi.fn().mockResolvedValue({}),
  markCalled:         vi.fn().mockResolvedValue({}),
  getDialListStats:   vi.fn().mockResolvedValue({ pending: 0, called: 0, skipped: 0 }),
  addDialListEntries: vi.fn().mockResolvedValue({}),
  startPredictive:    vi.fn().mockResolvedValue({ listId: 'list-1', running: true, dialed: 0, answered: 0, dropped: 0, amdDetected: 0, inFlight: 0, dropRate: 0, answerRate: 0, availAgents: 0, multiplier: 1 }),
  stopPredictive:     vi.fn().mockResolvedValue({}),
}));

const makeList = (overrides = {}) => ({
  id: 'list-1', name: 'Campaña Test', status: 'draft',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  _count: { entries: 10 }, ...overrides,
});

const makeStore = () =>
  configureStore({
    reducer: { calls: callsReducer },
    preloadedState: {
      calls: {
        activeCall: null, pendingWrapUp: null, incomingCall: null,
        queueEntries: [], predictiveStats: null, callHistory: [],
        total: 0, agendaEntries: [], reminders: [], loading: false,
        error: null, wsConnected: false, agentStatus: 'available', dialerOpen: false,
      },
    } as any,
  });

const renderPage = () =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <DialerPage />
      </MemoryRouter>
    </Provider>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('DialerPage — vista listas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el título "Preview Dialer"', async () => {
    renderPage();
    expect(await screen.findByText('Preview Dialer')).toBeInTheDocument();
  });

  it('muestra "No hay listas" cuando el servidor devuelve lista vacía', async () => {
    renderPage();
    expect(await screen.findByText(/no hay listas/i)).toBeInTheDocument();
  });

  it('muestra las listas cuando hay datos', async () => {
    const { listDialLists } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([makeList()]);
    renderPage();
    expect(await screen.findByText('Campaña Test')).toBeInTheDocument();
    expect(screen.getByText('10 contactos')).toBeInTheDocument();
  });

  it('el botón "Nueva lista" muestra el formulario', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /nueva lista/i }));
    expect(screen.getByPlaceholderText(/nombre de la lista/i)).toBeInTheDocument();
  });

  it('crear lista llama al servicio y actualiza la vista', async () => {
    const { createDialList, listDialLists } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /nueva lista/i }));
    const input = screen.getByPlaceholderText(/nombre de la lista/i);
    fireEvent.change(input, { target: { value: 'Campaña Nueva' } });
    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => expect(createDialList).toHaveBeenCalledWith('Campaña Nueva'));
  });

  it('el botón Eliminar llama a deleteDialList', async () => {
    const { listDialLists, deleteDialList } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([makeList()]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(deleteDialList).toHaveBeenCalledWith('list-1'));
  });
});

describe('DialerPage — vista activa', () => {
  beforeEach(() => vi.clearAllMocks());

  const openActiveView = async () => {
    const { listDialLists, updateDialList } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([makeList({ status: 'active' })]);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /abrir/i }));
  };

  it('muestra "no quedan contactos" cuando getNextEntry devuelve null', async () => {
    await openActiveView();
    expect(await screen.findByText(/lista completada/i)).toBeInTheDocument();
  });

  it('muestra el contacto siguiente cuando getNextEntry devuelve datos', async () => {
    const { listDialLists, getNextEntry } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([makeList({ status: 'active' })]);
    (getNextEntry as any).mockResolvedValue({ id: 'e1', phone: '+34611111111', clientName: 'Juan López', attempts: 0 });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /abrir/i }));
    expect(await screen.findByText('+34611111111')).toBeInTheDocument();
    expect(screen.getByText('Juan López')).toBeInTheDocument();
  });

  it('el botón Omitir llama a skipEntry', async () => {
    const { listDialLists, getNextEntry, skipEntry } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([makeList({ status: 'active' })]);
    (getNextEntry as any).mockResolvedValue({ id: 'e1', phone: '+34611111111', attempts: 0 });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /abrir/i }));
    await screen.findByText('+34611111111');
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }));
    await waitFor(() => expect(skipEntry).toHaveBeenCalledWith('list-1', 'e1'));
  });

  it('botón "Importar contactos" muestra el formulario de bulk', async () => {
    await openActiveView();
    fireEvent.click(await screen.findByRole('button', { name: /importar contactos/i }));
    // la pista de formato es un <p> único al abrir el formulario de bulk
    expect(screen.getByText(/un contacto por línea/i)).toBeInTheDocument();
  });
});

describe('DialerPage — vista predictiva', () => {
  beforeEach(() => vi.clearAllMocks());

  it('el botón "Activar marcador predictivo" activa la vista predictiva', async () => {
    const { listDialLists, getNextEntry, startPredictive } = await import('@/features/calls/services/dialerService');
    (listDialLists as any).mockResolvedValue([makeList({ status: 'active' })]);
    (getNextEntry as any).mockResolvedValue({ id: 'e1', phone: '+34611111111', attempts: 0 });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /abrir/i }));
    await screen.findByText('+34611111111');
    fireEvent.click(screen.getByRole('button', { name: /activar marcador predictivo/i }));
    await waitFor(() => expect(startPredictive).toHaveBeenCalledWith('list-1'));
    // badge MOCK es único en la vista predictiva
    expect(await screen.findByText('MOCK')).toBeInTheDocument();
  });
});
