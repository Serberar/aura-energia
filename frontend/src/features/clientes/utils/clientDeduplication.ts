/* src/features/clientes/utils/clientDeduplication.ts */

import type { Client, AddressInfo } from '../../../types';

/**
 * Calcula un puntaje de completitud para un cliente
 * Se usa para determinar cuál es el registro más completo
 */
export const calculateClientCompleteness = (client: Client): number => {
  let score = 0;
  if (client.firstName) score += 1;
  if (client.lastName) score += 1;
  if (client.dni) score += 1;
  if (client.email) score += 2;
  if (client.birthday) score += 1;
  if (client.phones?.length) score += client.phones.length;
  if (client.addresses?.length) score += client.addresses.length * 2;
  if (client.bankAccounts?.length) score += client.bankAccounts.length * 2;
  if (client.comments?.length) score += client.comments.length;
  if (client.authorized) score += 1;
  if (client.businessName) score += 1;
  return score;
};

/**
 * Une dos arrays eliminando duplicados (case-insensitive para strings)
 */
export const mergeArrays = <T>(arr1: T[], arr2: T[]): T[] => {
  const result = [...arr1];
  for (const item of arr2) {
    const itemStr = typeof item === 'string' ? item.toLowerCase().trim() : JSON.stringify(item);
    const exists = result.some(existing => {
      const existingStr = typeof existing === 'string' ? existing.toLowerCase().trim() : JSON.stringify(existing);
      return existingStr === itemStr;
    });
    if (!exists) {
      result.push(item);
    }
  }
  return result;
};

/**
 * Une dos arrays de direcciones eliminando duplicados
 */
export const mergeAddresses = (arr1: AddressInfo[], arr2: AddressInfo[]): AddressInfo[] => {
  const result = [...arr1];
  for (const addr of arr2) {
    const addrNormalized = addr.address?.toLowerCase().trim() || '';
    const exists = result.some(existing =>
      (existing.address?.toLowerCase().trim() || '') === addrNormalized
    );
    if (!exists && addrNormalized) {
      result.push(addr);
    }
  }
  return result;
};

/**
 * Fusiona múltiples clientes con el mismo DNI en uno solo
 * Combina teléfonos, direcciones, cuentas, comentarios y nombres de empresa
 * Usa el registro más completo como base
 */
export const mergeClients = (clients: Client[]): Client => {
  if (clients.length === 1) return clients[0];

  // Ordenar por completitud descendente (el más completo primero)
  const sorted = [...clients].sort((a, b) =>
    calculateClientCompleteness(b) - calculateClientCompleteness(a)
  );

  // Usar el más completo como base
  const base = sorted[0];

  // Fusionar datos de todos los demás
  let mergedPhones = base.phones || [];
  let mergedAddresses = base.addresses || [];
  let mergedBankAccounts = base.bankAccounts || [];
  let mergedComments = base.comments || [];

  // Recopilar nombres de empresa únicos (no vacíos y no repetidos)
  const businessNames: string[] = [];
  for (const client of sorted) {
    if (client.businessName?.trim()) {
      const normalized = client.businessName.trim().toLowerCase();
      const exists = businessNames.some(bn => bn.toLowerCase() === normalized);
      if (!exists) {
        businessNames.push(client.businessName.trim());
      }
    }
  }

  for (let i = 1; i < sorted.length; i++) {
    const client = sorted[i];
    mergedPhones = mergeArrays(mergedPhones, client.phones || []);
    mergedAddresses = mergeAddresses(mergedAddresses, client.addresses || []);
    mergedBankAccounts = mergeArrays(mergedBankAccounts, client.bankAccounts || []);
    mergedComments = mergeArrays(mergedComments, client.comments || []);
  }

  return {
    ...base,
    phones: mergedPhones,
    addresses: mergedAddresses,
    bankAccounts: mergedBankAccounts,
    comments: mergedComments,
    // Mostrar todos los nombres de empresa únicos separados por coma
    businessName: businessNames.length > 0 ? businessNames.join(', ') : undefined,
  };
};

/**
 * Deduplica clientes del CRM agrupando por DNI y fusionando sus datos
 */
export const deduplicateCrmClients = (clients: Client[]): Client[] => {
  // Agrupar por DNI (normalizado)
  const grouped = new Map<string, Client[]>();

  for (const client of clients) {
    const dniKey = client.dni?.toLowerCase().trim() || `no-dni-${client.id}`;
    const existing = grouped.get(dniKey) || [];
    existing.push(client);
    grouped.set(dniKey, existing);
  }

  // Fusionar cada grupo
  const deduplicated: Client[] = [];
  for (const group of grouped.values()) {
    deduplicated.push(mergeClients(group));
  }

  return deduplicated;
};
