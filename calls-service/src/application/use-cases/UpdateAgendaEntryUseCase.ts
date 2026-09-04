import type { IAgendaRepository, UpdateAgendaInput } from '@domain/repositories/IAgendaRepository';
import type { AgendaEntry } from '@domain/entities/AgendaEntry';

export class UpdateAgendaEntryUseCase {
  constructor(private agenda: IAgendaRepository) {}

  async execute(id: string, input: UpdateAgendaInput): Promise<AgendaEntry> {
    const entry = await this.agenda.findById(id);
    if (!entry) throw new Error(`AgendaEntry not found: ${id}`);
    return this.agenda.update(id, input);
  }
}
