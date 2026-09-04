import { prisma } from './prismaClient';
import type { IAgendaRepository, CreateAgendaInput, UpdateAgendaInput } from '@domain/repositories/IAgendaRepository';
import type { AgendaEntry, AgendaStatus } from '@domain/entities/AgendaEntry';

export class AgendaPrismaRepository implements IAgendaRepository {
  async create(input: CreateAgendaInput): Promise<AgendaEntry> {
    return prisma.agendaEntry.create({ data: input }) as Promise<AgendaEntry>;
  }

  async findById(id: string): Promise<AgendaEntry | null> {
    return prisma.agendaEntry.findUnique({ where: { id } }) as Promise<AgendaEntry | null>;
  }

  async update(id: string, input: UpdateAgendaInput): Promise<AgendaEntry> {
    return prisma.agendaEntry.update({ where: { id }, data: input }) as Promise<AgendaEntry>;
  }

  async delete(id: string): Promise<void> {
    await prisma.agendaEntry.delete({ where: { id } });
  }

  async listByAgent(agentId: string, filter?: { status?: AgendaStatus }): Promise<AgendaEntry[]> {
    return prisma.agendaEntry.findMany({
      where: { agentId, ...(filter?.status && { status: filter.status }) },
      orderBy: { scheduledAt: 'asc' },
    }) as Promise<AgendaEntry[]>;
  }

  async findDueReminders(now: Date): Promise<AgendaEntry[]> {
    return prisma.agendaEntry.findMany({
      where: { status: 'pending', reminderAt: { lte: now } },
    }) as Promise<AgendaEntry[]>;
  }

  async clearReminder(id: string): Promise<void> {
    await prisma.agendaEntry.update({ where: { id }, data: { reminderAt: null } });
  }
}
