import axios from 'axios';
import { prisma } from '@infrastructure/prisma/prismaClient';
import { config } from '../../config';

export interface CrmFilter {
  saleStatusIds?: string[];
  productIds?: string[];
  maxResults?: number;
}

interface CrmClientDTO {
  id: string;
  firstName: string;
  lastName: string;
  businessName?: string | null;
  phones: string[];
}

export class CampaignService {
  /**
   * Calls the CRM internal endpoint to get matching clients and creates
   * DialListEntry records for each phone number, skipping DNC numbers
   * and phones already in the list.
   */
  async importClientsFromCRM(
    dialListId: string,
    filter: CrmFilter,
  ): Promise<{ imported: number; skipped: number; total: number }> {
    const params = new URLSearchParams();
    if (filter.saleStatusIds?.length)
      params.set('saleStatusIds', filter.saleStatusIds.join(','));
    if (filter.productIds?.length)
      params.set('productIds', filter.productIds.join(','));
    if (filter.maxResults)
      params.set('maxResults', String(filter.maxResults));

    const { data: clients } = await axios.get<CrmClientDTO[]>(
      `${config.crmBackendUrl}/internal/clients-for-campaign?${params.toString()}`,
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 30_000,
      },
    );

    // Load existing phones in this list to avoid duplicates
    const existing = await prisma.dialListEntry.findMany({
      where:  { listId: dialListId },
      select: { phone: true },
    });
    const existingPhones = new Set(existing.map((e) => e.phone));

    // Load active DNC entries
    const dncEntries = await prisma.dncEntry.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      select: { phone: true },
    });
    const dncPhones = new Set(dncEntries.map((d) => d.phone));

    // Build entries: one row per phone, skip duplicates and DNC
    const entries: {
      listId:     string;
      phone:      string;
      clientId:   string;
      clientName: string;
      status:     'pending';
    }[] = [];

    for (const client of clients) {
      const clientName =
        client.businessName?.trim() ||
        `${client.firstName} ${client.lastName}`.trim();

      for (const rawPhone of client.phones) {
        const phone = rawPhone.trim();
        if (!phone) continue;
        if (dncPhones.has(phone)) continue;
        if (existingPhones.has(phone)) continue;
        entries.push({ listId: dialListId, phone, clientId: client.id, clientName, status: 'pending' });
        existingPhones.add(phone); // prevent same phone appearing twice from different records
      }
    }

    // Insert in batches of 500
    let imported = 0;
    const BATCH = 500;
    for (let i = 0; i < entries.length; i += BATCH) {
      const result = await prisma.dialListEntry.createMany({
        data:           entries.slice(i, i + BATCH),
        skipDuplicates: true,
      });
      imported += result.count;
    }

    return { imported, skipped: clients.length - entries.length, total: clients.length };
  }
}
