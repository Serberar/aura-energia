import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./services/skoreService', () => ({
  login1Skore: vi.fn(),
  search1Skore: vi.fn(),
}));

import skoreReducer, {
  clearSkoreResult,
  doLogin1Skore,
  doSearch1Skore,
} from './skoreSlice';
import * as skoreService from './services/skoreService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  const reducerMap: any = { skore: skoreReducer };
  return configureStore({ reducer: reducerMap });
}

const mockSearchResponse = {
  success: 1,
  name: 'Juan López',
  dni: '12345678A',
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('skoreSlice – synchronous reducers', () => {
  it('initial state has null cookie, result and error', () => {
    const state = skoreReducer(undefined, { type: '@@INIT' });
    expect(state.cookie).toBeNull();
    expect(state.result).toBeNull();
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('clearSkoreResult sets result and error to null', () => {
    const stateWithData = skoreReducer(
      { cookie: 'session-abc', loading: false, result: mockSearchResponse, error: 'prev error' },
      clearSkoreResult()
    );
    expect(stateWithData.result).toBeNull();
    expect(stateWithData.error).toBeNull();
    // cookie should remain
    expect(stateWithData.cookie).toBe('session-abc');
  });
});

// ─── doLogin1Skore thunk ──────────────────────────────────────────────────────

describe('doLogin1Skore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores cookie in state on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'my-cookie-123' });

    await store.dispatch(doLogin1Skore());

    expect(store.getState().skore.cookie).toBe('my-cookie-123');
  });

  it('does not update cookie on rejected', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockRejectedValue(new Error('Login failed'));

    await store.dispatch(doLogin1Skore());

    expect(store.getState().skore.cookie).toBeNull();
  });
});

// ─── doSearch1Skore thunk ─────────────────────────────────────────────────────

describe('doSearch1Skore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockReturnValue(new Promise(() => {}));
    store.dispatch(doSearch1Skore('12345678A'));
    expect(store.getState().skore.loading).toBe(true);
    expect(store.getState().skore.error).toBeNull();
  });

  it('auto-logins when cookie is absent before searching', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'auto-cookie' });
    vi.mocked(skoreService.search1Skore).mockResolvedValue(mockSearchResponse);

    await store.dispatch(doSearch1Skore('12345678A'));

    expect(skoreService.login1Skore).toHaveBeenCalledTimes(1);
    expect(skoreService.search1Skore).toHaveBeenCalledWith('dni', '12345678A', 'auto-cookie');
  });

  it('skips login when cookie already exists', async () => {
    const store = makeStore();
    // Pre-set cookie via login
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'existing-cookie' });
    await store.dispatch(doLogin1Skore());
    vi.clearAllMocks();

    vi.mocked(skoreService.search1Skore).mockResolvedValue(mockSearchResponse);

    await store.dispatch(doSearch1Skore('12345678A'));

    expect(skoreService.login1Skore).not.toHaveBeenCalled();
    expect(skoreService.search1Skore).toHaveBeenCalledWith('dni', '12345678A', 'existing-cookie');
  });

  it('detects 9-digit input as phone type', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockResolvedValue(mockSearchResponse);

    await store.dispatch(doSearch1Skore('612345678'));

    expect(skoreService.search1Skore).toHaveBeenCalledWith('phone', '612345678', 'c');
  });

  it('detects non-9-digit input as dni type', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockResolvedValue(mockSearchResponse);

    await store.dispatch(doSearch1Skore('12345678A'));

    expect(skoreService.search1Skore).toHaveBeenCalledWith('dni', '12345678A', 'c');
  });

  it('sets result on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockResolvedValue(mockSearchResponse);

    await store.dispatch(doSearch1Skore('12345678A'));

    const { skore } = store.getState();
    expect(skore.loading).toBe(false);
    expect(skore.result).toEqual(mockSearchResponse);
  });

  it('parses msg array as JSON when result.msg is an array', async () => {
    const store = makeStore();
    const parsedData = { success: 1, data: { name: 'Test' } };
    const responseWithMsgArray = {
      success: 1,
      msg: [JSON.stringify(parsedData)],
    };
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockResolvedValue(responseWithMsgArray);

    await store.dispatch(doSearch1Skore('12345678A'));

    const { result } = store.getState().skore;
    expect(result).toEqual(parsedData);
  });

  it('keeps raw result when msg is not an array', async () => {
    const store = makeStore();
    const responseWithStringMsg = { success: 1, msg: 'plain string message' };
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockResolvedValue(responseWithStringMsg);

    await store.dispatch(doSearch1Skore('12345678A'));

    expect(store.getState().skore.result).toEqual(responseWithStringMsg);
  });

  it('sets error message on rejected', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockRejectedValue(new Error('Connection timeout'));

    await store.dispatch(doSearch1Skore('12345678A'));

    const { skore } = store.getState();
    expect(skore.loading).toBe(false);
    expect(skore.error).toBe('Connection timeout');
  });

  it('uses default error message when rejected error has no message', async () => {
    const store = makeStore();
    vi.mocked(skoreService.login1Skore).mockResolvedValue({ cookie: 'c' });
    vi.mocked(skoreService.search1Skore).mockRejectedValue({});

    await store.dispatch(doSearch1Skore('12345678A'));

    expect(store.getState().skore.error).toBe('Error al buscar en 1Skore');
  });
});
