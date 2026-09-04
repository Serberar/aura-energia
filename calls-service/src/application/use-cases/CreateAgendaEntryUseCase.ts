import type { IAgendaRepository, CreateAgendaInput } from '@domain/repositories/IAgendaRepository';
import type { AgendaEntry } from '@domain/entities/AgendaEntry';

export class CreateAgendaEntryUseCase {
  constructor(private agenda: IAgendaRepository) {}

  async execute(input: CreateAgendaInput): Promise<AgendaEntry> {
    return this.agenda.create(input);
  }
}
