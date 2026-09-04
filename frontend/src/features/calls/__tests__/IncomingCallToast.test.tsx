import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import callsReducer, { wsIncomingCall } from '../callsSlice';
import IncomingCallToast from '../components/IncomingCallToast';

vi.mock('@/api/axios', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: {} }) },
}));

const makeStore = (incomingCall: any = null) =>
  configureStore({
    reducer: { calls: callsReducer },
    preloadedState: {
      calls: {
        activeCall: null, pendingWrapUp: null, incomingCall,
        queueEntries: [], predictiveStats: null,
        callHistory: [], total: 0, agendaEntries: [], reminders: [],
        loading: false, error: null, wsConnected: false,
        agentStatus: 'offline', dialerOpen: false,
      },
    } as any,
  });

const incomingNotif = { callId: 'call-1', from: '+34600000099', to: '+34900000000', agentId: 'a1' };

describe('IncomingCallToast', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no renderiza nada sin llamada entrante', () => {
    const { container } = render(
      <Provider store={makeStore()}><IncomingCallToast /></Provider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra el número del que llama cuando hay llamada entrante', () => {
    render(
      <Provider store={makeStore(incomingNotif)}><IncomingCallToast /></Provider>
    );
    expect(screen.getByText('+34600000099')).toBeInTheDocument();
  });

  it('tiene botones de contestar y rechazar', () => {
    render(
      <Provider store={makeStore(incomingNotif)}><IncomingCallToast /></Provider>
    );
    expect(screen.getByRole('button', { name: /contestar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
  });

  it('despacha dismissIncomingCall al rechazar', async () => {
    const store = makeStore(incomingNotif);
    render(<Provider store={store}><IncomingCallToast /></Provider>);

    fireEvent.click(screen.getByRole('button', { name: /rechazar/i }));

    await waitFor(() => {
      expect(store.getState().calls.incomingCall).toBeNull();
    });
  });
});
