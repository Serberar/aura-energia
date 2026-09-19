import { describe, it, expect } from 'vitest';
import {
  calculateClientCompleteness,
  mergeArrays,
  mergeAddresses,
  mergeClients,
  deduplicateCrmClients,
} from './clientDeduplication';
import type { Client } from '@/types/sales';

// ─── helpers ──────────────────────────────────────────────────────────────────

const baseClient: Client = {
  id: 'client-1',
  firstName: 'María',
  lastName: 'González',
  dni: '12345678A',
  email: 'maria@example.com',
  phones: ['612345678'],
  addresses: [],
  bankAccounts: [],
  comments: [],
  birthday: undefined,
  businessName: undefined,
  authorized: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ─── calculateClientCompleteness ──────────────────────────────────────────────

describe('calculateClientCompleteness', () => {
  it('returns 0 for empty client', () => {
    const empty = { ...baseClient, firstName: '', lastName: '', dni: '', email: '', phones: [], addresses: [], bankAccounts: [], comments: [], birthday: undefined, businessName: undefined, authorized: undefined };
    expect(calculateClientCompleteness(empty)).toBe(0);
  });

  it('adds score for each filled field', () => {
    const score = calculateClientCompleteness(baseClient);
    // firstName=1, lastName=1, dni=1, email=2, phones.length=1 → 6
    expect(score).toBe(6);
  });

  it('adds 2 per address', () => {
    const client = { ...baseClient, addresses: [{ address: 'C/ Mayor 1' }, { address: 'C/ Sol 2' }] };
    const scoreBase = calculateClientCompleteness(baseClient);
    const scoreWithAddresses = calculateClientCompleteness(client);
    expect(scoreWithAddresses - scoreBase).toBe(4);
  });

  it('adds 1 for authorized=true', () => {
    const withAuth = { ...baseClient, authorized: 'Sí' };
    expect(calculateClientCompleteness(withAuth)).toBeGreaterThan(calculateClientCompleteness(baseClient));
  });

  it('adds 1 for businessName', () => {
    const withBusiness = { ...baseClient, businessName: 'Empresa SA' };
    expect(calculateClientCompleteness(withBusiness)).toBeGreaterThan(calculateClientCompleteness(baseClient));
  });
});

// ─── mergeArrays ──────────────────────────────────────────────────────────────

describe('mergeArrays', () => {
  it('returns all items from arr1 plus unique items from arr2', () => {
    const result = mergeArrays(['a', 'b'], ['b', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('deduplicates case-insensitively', () => {
    const result = mergeArrays(['ABC'], ['abc']);
    expect(result).toHaveLength(1);
  });

  it('handles empty arrays', () => {
    expect(mergeArrays([], ['x'])).toEqual(['x']);
    expect(mergeArrays(['x'], [])).toEqual(['x']);
    expect(mergeArrays<string>([], [])).toEqual([]);
  });

  it('keeps original casing from arr1', () => {
    const result = mergeArrays(['Hello'], ['hello']);
    expect(result[0]).toBe('Hello');
  });
});

// ─── mergeAddresses ───────────────────────────────────────────────────────────

describe('mergeAddresses', () => {
  it('combines addresses without duplicates', () => {
    const addr1 = [{ address: 'Calle Mayor 1' }];
    const addr2 = [{ address: 'Calle Sol 2' }];
    const result = mergeAddresses(addr1, addr2);
    expect(result).toHaveLength(2);
  });

  it('does not add duplicate addresses', () => {
    const addr = [{ address: 'Calle Mayor 1' }];
    const result = mergeAddresses(addr, [{ address: 'calle mayor 1' }]);
    expect(result).toHaveLength(1);
  });

  it('ignores empty address strings', () => {
    const result = mergeAddresses([], [{ address: '' }]);
    expect(result).toHaveLength(0);
  });
});

// ─── mergeClients ─────────────────────────────────────────────────────────────

describe('mergeClients', () => {
  it('returns the single client unchanged', () => {
    expect(mergeClients([baseClient])).toBe(baseClient);
  });

  it('uses most complete client as base', () => {
    const lessComplete = { ...baseClient, id: 'client-2', email: '', dni: '' };
    const result = mergeClients([lessComplete, baseClient]);
    // base should be the more complete one (baseClient)
    expect(result.id).toBe('client-1');
  });

  it('merges phones from both clients', () => {
    const client2 = { ...baseClient, id: 'client-2', phones: ['910000000'] };
    const result = mergeClients([baseClient, client2]);
    expect(result.phones).toContain('612345678');
    expect(result.phones).toContain('910000000');
  });

  it('does not duplicate phones', () => {
    const client2 = { ...baseClient, id: 'client-2' };
    const result = mergeClients([baseClient, client2]);
    expect(result.phones.filter(p => p === '612345678')).toHaveLength(1);
  });

  it('merges business names separated by comma', () => {
    const client1 = { ...baseClient, businessName: 'Empresa A' };
    const client2 = { ...baseClient, id: 'client-2', businessName: 'Empresa B' };
    const result = mergeClients([client1, client2]);
    expect(result.businessName).toContain('Empresa A');
    expect(result.businessName).toContain('Empresa B');
  });
});

// ─── deduplicateCrmClients ────────────────────────────────────────────────────

describe('deduplicateCrmClients', () => {
  it('returns same clients when no duplicates', () => {
    const client2 = { ...baseClient, id: 'client-2', dni: 'B87654321' };
    const result = deduplicateCrmClients([baseClient, client2]);
    expect(result).toHaveLength(2);
  });

  it('merges clients with same DNI', () => {
    const client2 = { ...baseClient, id: 'client-2', phones: ['910000000'] };
    const result = deduplicateCrmClients([baseClient, client2]);
    expect(result).toHaveLength(1);
    expect(result[0].phones).toContain('910000000');
  });

  it('handles clients without DNI separately', () => {
    const noDni1 = { ...baseClient, id: 'c1', dni: '' };
    const noDni2 = { ...baseClient, id: 'c2', dni: undefined as any };
    const result = deduplicateCrmClients([noDni1, noDni2]);
    // Each gets its own no-dni key, so 2 separate clients
    expect(result).toHaveLength(2);
  });

  it('deduplicates by DNI case-insensitively', () => {
    const client1 = { ...baseClient, id: 'c1', dni: '12345678A' };
    const client2 = { ...baseClient, id: 'c2', dni: '12345678a' };
    const result = deduplicateCrmClients([client1, client2]);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateCrmClients([])).toEqual([]);
  });
});
